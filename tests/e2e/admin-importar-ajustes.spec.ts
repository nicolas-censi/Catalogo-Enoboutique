import { randomInt } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { clienteAdmin, limpiarDatos, limpiarUsuarios, prefijo } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// Spec 008, CA-4 y CA-5: diccionario de abreviaturas y bodegas de Tango (computadora).
test.use({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false });
test.describe.configure({ mode: "serial" });

const admin = clienteAdmin();
const letras = (n: number) => Array.from({ length: n }, () => String.fromCharCode(65 + randomInt(26))).join("");
const abreviatura = `ZZ${letras(6)}`;
const codigoBodega = `q${letras(2).toLowerCase()}`;
const encargados: string[] = [];

test.beforeAll(async () => {
  const b = await admin.from("bodegas").insert({ nombre: `${prefijo} Bodega sugerida`, codigo_tango: codigoBodega }).select().single();
  await admin.from("productos").insert({ tipo: "vino", nombre: `${prefijo} Vino`, bodega_id: b.data!.id });
  await admin.from("bodegas").insert({ nombre: `${prefijo} Otra bodega` });
});

test.afterAll(async () => {
  await admin.from("abreviaturas").delete().eq("abreviatura", abreviatura);
  await admin.from("importaciones").delete().in("creada_por", encargados);
  await limpiarDatos();
  await limpiarUsuarios();
});

const entrarComoEncargado = async (context: Parameters<typeof entrarComo>[0]) =>
  encargados.push((await entrarComo(context, "encargado")).usuario.id);
const filaAbreviatura = (page: Page) => page.getByRole("table", { name: "Abreviaturas" }).getByRole("row").filter({ hasText: abreviatura });

test("solo el encargado entra al diccionario y a las bodegas", async ({ page, context }) => {
  await entrarComo(context, "vendedor");
  for (const ruta of ["/admin/importar/abreviaturas", "/admin/importar/bodegas"]) {
    await page.goto(ruta);
    await expect(page.getByText("No tenés acceso al panel.")).toBeVisible();
  }
});

test("CA-4: agrega, cambia y borra una abreviatura, y la importación la usa", async ({ page, context }) => {
  await entrarComoEncargado(context);
  await page.goto("/admin/importar");
  await page.getByRole("link", { name: "Diccionario de abreviaturas" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Diccionario de abreviaturas" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Abreviaturas" }).getByRole("row").filter({ hasText: "Malbec" }).first()).toBeVisible();

  await page.getByLabel("Abreviatura", { exact: true }).fill(abreviatura.toLowerCase());
  await page.getByLabel("Significa", { exact: true }).fill("Gran Reserva Especial");
  await page.getByRole("button", { name: "Guardar abreviatura" }).click();
  await expect(filaAbreviatura(page)).toContainText("Gran Reserva Especial");

  await filaAbreviatura(page).getByRole("button", { name: "Cambiar" }).click();
  await expect(page.getByLabel("Abreviatura", { exact: true })).toHaveValue(abreviatura);
  await page.getByLabel("Significa", { exact: true }).fill("Edición Especial");
  await page.getByLabel("Es un varietal", { exact: true }).check();
  await page.getByRole("button", { name: "Guardar abreviatura" }).click();
  await expect(filaAbreviatura(page)).toContainText("Edición Especial");
  await expect(filaAbreviatura(page)).toContainText("Varietal");

  // La importación usa el diccionario: se ve en el resumen (sin aplicarla).
  await page.goto("/admin/importar");
  await page.getByLabel("Reporte de Tango (Excel o CSV)").setInputFiles({
    name: "precios.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(`Cód. artículo;Descripción;Código de barras;Precio\nVIqqq${prefijo};PRUEBA ${abreviatura};;100\n`),
  });
  await page.getByRole("button", { name: "Ver qué cambia" }).click();
  await expect(page.getByRole("table", { name: "Productos nuevos" })).toContainText("Prueba Edición Especial");

  await page.goto("/admin/importar/abreviaturas");
  await filaAbreviatura(page).getByRole("button", { name: "Borrar" }).click();
  await expect(filaAbreviatura(page)).toHaveCount(0);
});

test("CA-5: corrige el nombre de una bodega de Tango", async ({ page, context }) => {
  await entrarComoEncargado(context);
  await page.goto("/admin/importar");
  await page.getByRole("link", { name: "Bodegas de Tango" }).click();
  const fila = page.getByRole("table", { name: "Bodegas de Tango" }).getByRole("row").filter({ hasText: codigoBodega });
  await expect(fila).toContainText("1 producto");
  const campo = fila.getByLabel(`Nombre de la bodega ${codigoBodega}`);
  await expect(campo).toHaveValue(`${prefijo} Bodega sugerida`);

  await campo.fill(`${prefijo} Otra bodega`);
  await fila.getByRole("button", { name: "Guardar" }).click();
  await expect(fila.getByRole("alert")).toHaveText("Ya hay una bodega con ese nombre.");

  await campo.fill(`${prefijo} Bodega corregida`);
  await fila.getByRole("button", { name: "Guardar" }).click();
  await expect(fila.getByRole("status")).toHaveText("Guardado.");
  expect((await admin.from("bodegas").select("nombre").eq("codigo_tango", codigoBodega).single()).data!.nombre).toBe(`${prefijo} Bodega corregida`);
});
