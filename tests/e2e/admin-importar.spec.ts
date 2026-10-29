import { randomInt } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { clienteAdmin, limpiarUsuarios, prefijo } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// Spec 008, CA-1 y CA-10: importar el reporte de Tango desde el panel (computadora).
// Usa un CSV chico con códigos propios del test; las secciones (Tintos) ya existen.
test.use({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false });
test.describe.configure({ mode: "serial" });

const admin = clienteAdmin();
const bodega = `q${String.fromCharCode(97 + randomInt(26))}${String.fromCharCode(97 + randomInt(26))}`;
const marca = `ZZ${prefijo.replace(/[^a-z0-9]/gi, "").toUpperCase()}`;
const titulo = (t: string) => t.charAt(0) + t.slice(1).toLowerCase();
const codigo = (n: number) => `VI${bodega}${prefijo}-${n}`;
const encargados: string[] = [];
const entrarComoEncargado = async (context: Parameters<typeof entrarComo>[0]) =>
  encargados.push((await entrarComo(context, "encargado")).usuario.id);
const csv = (precio2020: number) =>
  [
    "Cód. artículo;Descripción;Código de barras;Precio",
    `${codigo(1)};${marca} MAL 2020;;${precio2020}`,
    `${codigo(2)};${marca} MAL 2021;;"12.500,00"`,
    `${codigo(3)};${marca} CAB SAUV;;9000`,
  ].join("\n");

test.afterAll(async () => {
  const { data } = await admin.from("anadas").select("producto_id").like("codigo_tango", `VI${bodega}${prefijo}%`);
  await admin.from("productos").delete().in("id", (data ?? []).map((a) => a.producto_id));
  await admin.from("bodegas").delete().eq("codigo_tango", bodega);
  // Las importaciones del test se borran: si no, la carta real dejaría de contar como
  // "primera importación".
  await admin.from("importaciones").delete().in("creada_por", encargados);
  await limpiarUsuarios();
});

async function subir(page: Page, contenido: string, nombre = "precios.csv") {
  await page.goto("/admin/importar");
  await page.getByLabel("Reporte de Tango (Excel o CSV)").setInputFiles({ name: nombre, mimeType: "text/csv", buffer: Buffer.from(contenido) });
  await page.getByRole("button", { name: "Ver qué cambia" }).click();
}

test("CA-1: solo el encargado ve Importar", async ({ page, context }) => {
  await entrarComo(context, "vendedor");
  await page.goto("/admin");
  await expect(page.getByRole("navigation", { name: "Panel" }).getByRole("link", { name: "Importar" })).toHaveCount(0);
  await page.goto("/admin/importar");
  await expect(page.getByText("No tenés acceso al panel.")).toBeVisible();
});

test("CA-1: avisa si al archivo le faltan columnas", async ({ page, context }) => {
  await entrarComoEncargado(context);
  await subir(page, "Cód. artículo;Descripción\nVIx0001;X");
  await expect(page.getByRole("alert").filter({ hasText: "columnas" })).toHaveText(
    "Al archivo le faltan columnas del reporte «Precios por artículo»: Código de barras, Precio.",
  );
});

test("CA-1 y CA-10: muestra el resumen sin cambiar nada y aplica al confirmar", async ({ page, context }) => {
  await entrarComoEncargado(context);
  await subir(page, csv(10000));
  const resumen = page.getByRole("region", { name: "Resumen de la importación" });
  await expect(resumen).toBeVisible();
  await expect(resumen.locator('[data-dato="productosNuevos"]')).toHaveText("2");
  await expect(resumen.locator('[data-dato="anadasNuevas"]')).toHaveText("3");
  await expect(resumen.locator('[data-dato="preciosCambian"]')).toHaveText("0");
  // Todavía no cambió nada.
  expect((await admin.from("anadas").select("id").like("codigo_tango", `VI${bodega}${prefijo}%`)).data).toEqual([]);

  await page.getByRole("button", { name: "Importar" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Listo" })).toHaveText(
    "Listo: se crearon 2 productos con 3 añadas y se actualizaron 0 precios.",
  );
  const { data } = await admin
    .from("productos")
    .select("nombre, varietal, secciones(nombre), bodegas(codigo_tango), anadas(codigo_tango, anio, precio)")
    .ilike("nombre", `${marca} Malbec`)
    .single();
  expect(data).toMatchObject({ varietal: "Malbec", secciones: { nombre: "Tintos" }, bodegas: { codigo_tango: bodega } });
  expect(data!.anadas.map((a) => [a.anio, a.precio]).sort()).toEqual([
    [2020, 10000],
    [2021, 12500],
  ]);
});

test("CA-8: subir el reporte otra vez muestra y aplica los precios que cambian", async ({ page, context }) => {
  await entrarComoEncargado(context);
  await subir(page, csv(11000));
  const resumen = page.getByRole("region", { name: "Resumen de la importación" });
  await expect(resumen.locator('[data-dato="productosNuevos"]')).toHaveText("0");
  await expect(resumen.locator('[data-dato="preciosCambian"]')).toHaveText("1");
  await expect(resumen.getByRole("table", { name: "Precios que cambian" }).getByRole("row").filter({ hasText: codigo(1) })).toContainText(
    /\$\s*10\.000.*\$\s*11\.000/,
  );
  await page.getByRole("button", { name: "Importar" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Listo" })).toContainText("se actualizó 1 precio.");
  expect((await admin.from("anadas").select("precio").eq("codigo_tango", codigo(1)).single()).data!.precio).toBe(11000);
});

test("CA-11: elige la sección de los productos nuevos antes de importar, de a uno o de a varios", async ({ page, context }) => {
  // Una sección con subsecciones del test, para elegir una subsección.
  const cava = (await admin.from("secciones").insert({ nombre: `${prefijo} Cava importar`, orden: 95000 }).select().single()).data!.id;
  const joyitas = (await admin.from("secciones").insert({ nombre: `${prefijo} Joyitas importar`, orden: 1, seccion_padre_id: cava }).select().single()).data!.id;
  await entrarComoEncargado(context);
  await subir(
    page,
    [
      "Cód. artículo;Descripción;Código de barras;Precio",
      `${codigo(10)};${marca} ANFORA;;100`,
      `${codigo(11)};${marca} CUARTEL;;100`,
      `${codigo(12)};${marca} SYRAH;;100`,
    ].join("\n"),
  );
  const tabla = page.getByRole("table", { name: "Productos nuevos" });
  const seccionDe = (nombre: string) => tabla.getByRole("combobox", { name: `Sección de ${nombre}` });
  const anfora = `${titulo(marca)} Anfora`;
  const cuartel = `${titulo(marca)} Cuartel`;
  const syrah = `${titulo(marca)} Syrah`;
  await expect(seccionDe(syrah)).toHaveValue(/^(id|nueva):/); // sugerida: Tintos
  await expect(seccionDe(anfora)).toHaveValue("");

  // Solo los que quedan sin sección, todos juntos a una subsección.
  await page.getByLabel("Mostrar solo los que quedan sin sección").check();
  await expect(tabla.getByRole("checkbox", { name: new RegExp(`^Elegir ${marca}`, "i") })).toHaveCount(2);
  await page.getByRole("button", { name: "Seleccionar los 2 del filtro" }).click();
  await page.getByLabel("Poner los seleccionados en").selectOption({ label: `${prefijo} Cava importar › ${prefijo} Joyitas importar` });
  await page.getByRole("button", { name: "Aplicar a 2 seleccionados" }).click();
  await page.getByLabel("Mostrar solo los que quedan sin sección").uncheck();
  await expect(seccionDe(anfora)).toHaveValue(`id:${joyitas}`);
  await expect(seccionDe(cuartel)).toHaveValue(`id:${joyitas}`);

  // Uno solo, a mano.
  await seccionDe(syrah).selectOption("");
  await page.getByRole("button", { name: "Importar" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Listo" })).toBeVisible();
  const seccionEnBase = async (nombre: string) =>
    (await admin.from("productos").select("seccion_id").ilike("nombre", nombre).single()).data!.seccion_id;
  expect(await seccionEnBase(anfora)).toBe(joyitas);
  expect(await seccionEnBase(cuartel)).toBe(joyitas);
  expect(await seccionEnBase(syrah)).toBeNull();
  await admin.from("productos").delete().in("seccion_id", [joyitas]);
  await admin.from("secciones").delete().in("id", [joyitas, cava]);
});
