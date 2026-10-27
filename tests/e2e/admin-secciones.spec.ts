import { expect, test, type Page } from "@playwright/test";
import { clienteAdmin, limpiarDatos, limpiarUsuarios, prefijo } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// CA-9: secciones (computadora). Los nombres empiezan con el prefijo "test-", que el
// test del inicio de la carta ignora.
test.use({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false });
test.describe.configure({ mode: "serial" });

const admin = clienteAdmin();
const ids: Record<string, string> = {};

test.beforeAll(async () => {
  ids.conProductos = (await admin.from("secciones").insert({ nombre: `${prefijo} Con productos`, orden: 95 }).select().single()).data!.id;
  const p = await admin.from("productos").insert({ tipo: "vino", nombre: `En sección ${prefijo}`, seccion_id: ids.conProductos }).select().single();
  await admin.from("anadas").insert({ producto_id: p.data!.id, codigo_tango: `${prefijo}-s`, descripcion_tango: "X", tipo: "con_anio", anio: 2020, en_stock: true });
});

test.afterAll(async () => {
  await limpiarDatos();
  await limpiarUsuarios();
});

test.beforeEach(async ({ context }) => {
  await entrarComo(context, "vendedor");
});

const fila = (page: Page, nombre: string) => page.getByRole("table", { name: "Secciones" }).getByRole("row").filter({ hasText: nombre });
const enCarta = async (page: Page) => {
  await page.goto("/");
  const enlaces = page.getByRole("navigation", { name: "Secciones" }).getByRole("link");
  // Las secciones llegan en streaming: se espera a que estén antes de leerlas.
  await expect(enlaces.filter({ hasText: "Cava" })).toBeVisible();
  return enlaces.allTextContents();
};

test("CA-9: crea una sección y queda al final de la carta", async ({ page }) => {
  await page.goto("/admin");
  await page.getByRole("navigation", { name: "Panel" }).getByRole("link", { name: "Secciones" }).click();
  await expect(page).toHaveURL(/\/admin\/secciones$/);
  await page.getByLabel("Nombre de la sección nueva", { exact: true }).fill(`${prefijo} Orgánicos`);
  await page.getByRole("button", { name: "Crear sección" }).click();
  await expect(fila(page, `${prefijo} Orgánicos`)).toHaveCount(1);

  const { data } = await admin.from("secciones").select("nombre, orden").order("orden", { ascending: false }).limit(1).single();
  expect(data!.nombre).toBe(`${prefijo} Orgánicos`);
  ids.nueva = (await admin.from("secciones").select("id").eq("nombre", `${prefijo} Orgánicos`).single()).data!.id;
});

test("CA-9: no crea una sección sin nombre", async ({ page }) => {
  await page.goto("/admin/secciones");
  await page.getByRole("button", { name: "Crear sección" }).click();
  await expect(page.getByLabel("Nombre de la sección nueva", { exact: true })).toHaveAccessibleDescription("Escribí el nombre.");
});

test("CA-9: renombra una sección", async ({ page }) => {
  await page.goto("/admin/secciones");
  const f = fila(page, `${prefijo} Orgánicos`);
  await f.getByRole("button", { name: "Renombrar" }).click();
  // En modo edición el nombre está dentro de un campo (la fila ya no lo tiene como texto).
  const tabla = page.getByRole("table", { name: "Secciones" });
  await tabla.getByLabel("Nombre", { exact: true }).fill(`${prefijo} Naturales`);
  await tabla.getByRole("button", { name: "Guardar" }).click();
  await expect(fila(page, `${prefijo} Naturales`)).toHaveCount(1);
  const { data } = await admin.from("secciones").select("nombre").eq("id", ids.nueva).single();
  expect(data!.nombre).toBe(`${prefijo} Naturales`);
});

test("CA-9 y CA-8: ocultar una sección la saca de la carta y mostrarla la vuelve a poner", async ({ page }) => {
  expect(await enCarta(page)).toContain(`${prefijo} Con productos`);
  await page.goto("/admin/secciones");
  await fila(page, `${prefijo} Con productos`).getByRole("switch", { name: `Visible: ${prefijo} Con productos` }).click();
  await expect(fila(page, `${prefijo} Con productos`).getByRole("switch")).not.toBeChecked();
  await expect.poll(async () => (await admin.from("secciones").select("visible").eq("id", ids.conProductos).single()).data!.visible).toBe(false);
  expect(await enCarta(page)).not.toContain(`${prefijo} Con productos`);

  await page.goto("/admin/secciones");
  await fila(page, `${prefijo} Con productos`).getByRole("switch").click();
  await expect.poll(async () => (await admin.from("secciones").select("visible").eq("id", ids.conProductos).single()).data!.visible).toBe(true);
  expect(await enCarta(page)).toContain(`${prefijo} Con productos`);
});

test("CA-9: una sección con productos no se borra; se ofrece ocultarla", async ({ page }) => {
  await page.goto("/admin/secciones");
  const f = fila(page, `${prefijo} Con productos`);
  await expect(f).toContainText("1 producto");
  await f.getByRole("button", { name: "Borrar" }).click();
  await expect(f.getByRole("alert")).toHaveText("Tiene 1 producto: no se puede borrar. Podés ocultarla.");
  const { data } = await admin.from("secciones").select("id").eq("id", ids.conProductos);
  expect(data).toHaveLength(1);
});

test("CA-9: borra una sección vacía con confirmación", async ({ page }) => {
  await page.goto("/admin/secciones");
  const f = fila(page, `${prefijo} Naturales`);
  await f.getByRole("button", { name: "Borrar" }).click();
  await f.getByRole("button", { name: "Sí, borrar" }).click();
  await expect(fila(page, `${prefijo} Naturales`)).toHaveCount(0);
  const { data } = await admin.from("secciones").select("id").eq("id", ids.nueva);
  expect(data).toEqual([]);
});
