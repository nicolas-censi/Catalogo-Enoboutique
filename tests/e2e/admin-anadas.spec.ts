import { expect, test, type Page } from "@playwright/test";
import { clienteAdmin, limpiarDatos, limpiarUsuarios, prefijo } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// CA-5: añadas desde la ficha del producto (computadora).
test.use({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false });

const admin = clienteAdmin();
const ids: Record<string, string> = {};

test.beforeAll(async () => {
  ids.vino = (await admin.from("productos").insert({ tipo: "vino", nombre: `Zuccardi Q Cabernet ${prefijo}` }).select().single()).data!.id;
  await admin.from("anadas").insert([
    { producto_id: ids.vino, codigo_tango: `${prefijo}-q2021`, descripcion_tango: "ZUCCARDI Q CAB 2021", tipo: "con_anio", anio: 2021, precio: 24600, en_stock: true },
    { producto_id: ids.vino, codigo_tango: `${prefijo}-qsin`, descripcion_tango: "ZUCCARDI Q CAB", tipo: "sin_especificar", anio: null, precio: 20500, en_stock: true },
  ]);
  ids.aceite = (await admin.from("productos").insert({ tipo: "aceite", nombre: `AOVE Coratina ${prefijo}` }).select().single()).data!.id;
  await admin.from("anadas").insert({ producto_id: ids.aceite, codigo_tango: `${prefijo}-ac`, descripcion_tango: "AOVE CORATINA", tipo: "sin_anada", precio: 12000, en_stock: true });
});

test.afterAll(async () => {
  await limpiarDatos();
  await limpiarUsuarios();
});

test.beforeEach(async ({ context }) => {
  await entrarComo(context, "vendedor");
});

const agregar = (page: Page, nombre = "Agregar añada") => page.getByRole("form", { name: nombre });
const fila = (page: Page, texto: string) => page.getByRole("table", { name: "Añadas" }).getByRole("row").filter({ hasText: texto });
const anadasEnBase = async (productoId: string) =>
  (await admin.from("anadas").select("codigo_tango, tipo, anio, precio, en_stock").eq("producto_id", productoId).order("codigo_tango")).data;

test("CA-5: agrega una añada con precio escrito como en Argentina", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.vino}`);
  const form = agregar(page);
  await form.getByLabel("Tipo de añada", { exact: true }).selectOption("con_anio");
  await form.getByLabel("Año", { exact: true }).fill("2022");
  await form.getByLabel("Código de Tango", { exact: true }).fill(`${prefijo}-q2022`);
  await form.getByLabel("Descripción de Tango", { exact: true }).fill("ZUCCARDI Q CAB 2022");
  await form.getByLabel("Precio", { exact: true }).fill("$ 22.500");
  await form.getByRole("button", { name: "Agregar" }).click();

  await expect(fila(page, `${prefijo}-q2022`)).toContainText("2022");
  await expect(fila(page, `${prefijo}-q2022`)).toContainText(/\$\s*22\.500/);
  expect(await anadasEnBase(ids.vino)).toContainEqual({
    codigo_tango: `${prefijo}-q2022`,
    tipo: "con_anio",
    anio: 2022,
    precio: 22500,
    en_stock: true,
  });
  // El formulario queda vacío para cargar otra.
  await expect(form.getByLabel("Código de Tango", { exact: true })).toHaveValue("");
});

test("CA-5: los choques con las reglas muestran mensajes claros", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.vino}`);
  const form = agregar(page);
  await form.getByLabel("Tipo de añada", { exact: true }).selectOption("con_anio");
  await form.getByLabel("Año", { exact: true }).fill("2021");
  await form.getByLabel("Código de Tango", { exact: true }).fill(`${prefijo}-otro`);
  await form.getByRole("button", { name: "Agregar" }).click();
  await expect(form.getByRole("alert")).toHaveText("Este vino ya tiene la añada 2021.");

  await form.getByLabel("Año", { exact: true }).fill("2015");
  await form.getByLabel("Código de Tango", { exact: true }).fill(`${prefijo}-q2021`);
  await form.getByRole("button", { name: "Agregar" }).click();
  await expect(form.getByRole("alert")).toHaveText(`Ya existe una añada con el código ${prefijo}-q2021.`);

  await form.getByLabel("Año", { exact: true }).fill("15");
  await form.getByRole("button", { name: "Agregar" }).click();
  await expect(form.getByLabel("Año", { exact: true })).toHaveAccessibleDescription("Escribí el año (por ejemplo, 2020).");
});

test("CA-5: a una añada sin especificar se le pone el año y el precio", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.vino}`);
  const sinAnio = fila(page, `${prefijo}-qsin`);
  await sinAnio.getByRole("button", { name: "Editar" }).click();
  await sinAnio.getByLabel("Tipo de añada", { exact: true }).selectOption("con_anio");
  await sinAnio.getByLabel("Año", { exact: true }).fill("2019");
  await sinAnio.getByLabel("Precio", { exact: true }).fill("30.750");
  await sinAnio.getByRole("button", { name: "Guardar" }).click();

  await expect(fila(page, `${prefijo}-qsin`)).toContainText("2019");
  await expect(fila(page, `${prefijo}-qsin`)).not.toContainText("a revisar");
  expect(await anadasEnBase(ids.vino)).toContainEqual(
    expect.objectContaining({ codigo_tango: `${prefijo}-qsin`, tipo: "con_anio", anio: 2019, precio: 30750 }),
  );
});

test("CA-5: borra una añada con confirmación", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.vino}`);
  const anada = fila(page, `${prefijo}-q2021`);
  await anada.getByRole("button", { name: "Borrar" }).click();
  await expect(anada.getByText("¿Borrar la añada 2021?")).toBeVisible();
  await anada.getByRole("button", { name: "Cancelar" }).click();
  await expect(fila(page, `${prefijo}-q2021`)).toHaveCount(1);

  await anada.getByRole("button", { name: "Borrar" }).click();
  await anada.getByRole("button", { name: "Sí, borrar" }).click();
  await expect(fila(page, `${prefijo}-q2021`)).toHaveCount(0);
  expect((await anadasEnBase(ids.vino))!.map((a) => a.codigo_tango)).not.toContain(`${prefijo}-q2021`);
});

test("CA-5: un aceite no admite una segunda presentación", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.aceite}`);
  const form = agregar(page, "Agregar presentación");
  // En productos que no son vino no se elige tipo ni año.
  await expect(form.getByLabel("Tipo de añada", { exact: true })).toHaveCount(0);
  await expect(form.getByLabel("Año", { exact: true })).toHaveCount(0);
  await form.getByLabel("Código de Tango", { exact: true }).fill(`${prefijo}-ac2`);
  await form.getByRole("button", { name: "Agregar" }).click();
  await expect(form.getByRole("alert")).toHaveText("Un aceite tiene una sola presentación, sin año.");
});
