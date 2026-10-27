import { expect, test, type Page } from "@playwright/test";
import { clienteAdmin, limpiarDatos, limpiarUsuarios, prefijo } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// CA-6: códigos de barras desde la ficha del producto.
test.use({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false });

const admin = clienteAdmin();
const ids: Record<string, string> = {};
const base = String(Date.now()).slice(-9);
const codigos = { nuevo: `9995${base}`, ajeno: `9996${base}`, propio: `9997${base}` };

test.beforeAll(async () => {
  ids.vino = (await admin.from("productos").insert({ tipo: "vino", nombre: `El Enemigo Malbec ${prefijo}` }).select().single()).data!.id;
  ids.otro = (await admin.from("productos").insert({ tipo: "vino", nombre: `Gran Enemigo Gualtallary ${prefijo}` }).select().single()).data!.id;
  await admin.from("codigos_barras").insert([
    { codigo: codigos.ajeno, producto_id: ids.otro },
    { codigo: codigos.propio, producto_id: ids.vino },
  ]);
});

test.afterAll(async () => {
  await limpiarDatos();
  await limpiarUsuarios();
});

test.beforeEach(async ({ context }) => {
  await entrarComo(context, "vendedor");
});

const formulario = (page: Page) => page.getByRole("form", { name: "Agregar código de barras" });
const lista = (page: Page) => page.getByRole("list", { name: "Códigos de barras" });
const codigosEnBase = async (productoId: string) =>
  ((await admin.from("codigos_barras").select("codigo").eq("producto_id", productoId)).data ?? []).map((c) => c.codigo).sort();

test("CA-6: agrega un código de barras (ignora espacios)", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.vino}`);
  await expect(lista(page).getByRole("listitem")).toHaveText([new RegExp(codigos.propio)]);
  await formulario(page).getByLabel("Código de barras", { exact: true }).fill(` ${codigos.nuevo.slice(0, 4)} ${codigos.nuevo.slice(4)} `);
  await formulario(page).getByRole("button", { name: "Agregar" }).click();
  await expect(lista(page).getByRole("listitem").filter({ hasText: codigos.nuevo })).toHaveCount(1);
  expect(await codigosEnBase(ids.vino)).toContain(codigos.nuevo);
  await expect(formulario(page).getByLabel("Código de barras", { exact: true })).toHaveValue("");
});

test("CA-6: avisa de qué producto es un código que ya está usado", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.vino}`);
  await formulario(page).getByLabel("Código de barras", { exact: true }).fill(codigos.ajeno);
  await formulario(page).getByRole("button", { name: "Agregar" }).click();
  await expect(formulario(page).getByRole("alert")).toHaveText(
    `El código ${codigos.ajeno} ya es de Gran Enemigo Gualtallary ${prefijo}.`,
  );
  expect(await codigosEnBase(ids.otro)).toEqual([codigos.ajeno]);
});

test("CA-6: rechaza un código con letras o con pocos números", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.vino}`);
  const campo = formulario(page).getByLabel("Código de barras", { exact: true });
  await campo.fill("12AB");
  await formulario(page).getByRole("button", { name: "Agregar" }).click();
  await expect(campo).toHaveAccessibleDescription("El código de barras tiene que tener entre 8 y 14 números.");
});

test("CA-6: quita un código", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.vino}`);
  await lista(page).getByRole("button", { name: `Quitar ${codigos.propio}` }).click();
  await expect(lista(page).getByText(codigos.propio)).toHaveCount(0);
  expect(await codigosEnBase(ids.vino)).not.toContain(codigos.propio);
});
