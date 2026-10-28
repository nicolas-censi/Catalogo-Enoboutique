import { expect, test, type Page } from "@playwright/test";
import { clienteAdmin, limpiarDatos, limpiarUsuarios, prefijo } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// Spec 005, CA-3: destacados de una sección (computadora). Usa una sección propia.
test.use({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false });
test.describe.configure({ mode: "serial" });

const admin = clienteAdmin();
const seccion = `${prefijo} Destacados`;
const nombre = (n: string) => `${prefijo} ${n}`;
const ids: Record<string, string> = {};

test.beforeAll(async () => {
  ids.seccion = (await admin.from("secciones").insert({ nombre: seccion, orden: 20000 }).select().single()).data!.id;
  ids.otra = (await admin.from("secciones").insert({ nombre: `${prefijo} Otra`, orden: 20001 }).select().single()).data!.id;
  const bodega = async (n: string) => (await admin.from("bodegas").insert({ nombre: nombre(n) }).select().single()).data!.id;
  // Sin destacados, la sección queda: Alfa Malbec, Beta Malbec, Zeta Malbec (por bodega).
  const productos: [string, string, string, number, boolean][] = [
    ["Zeta Malbec", await bodega("Zeta"), ids.seccion, 1000, true],
    ["Alfa Malbec", await bodega("Alfa"), ids.seccion, 500, true],
    ["Beta Malbec", await bodega("Beta"), ids.seccion, 100, true],
    ["Gamma Malbec", await bodega("Gamma"), ids.seccion, 300, false],
    ["Malbec de otra sección", await bodega("Delta"), ids.otra, 100, true],
  ];
  for (const [n, bodega_id, seccion_id, precio, en_stock] of productos) {
    const p = await admin.from("productos").insert({ tipo: "vino", nombre: nombre(n), bodega_id, seccion_id }).select().single();
    ids[n] = p.data!.id;
    await admin
      .from("anadas")
      .insert({ producto_id: p.data!.id, codigo_tango: `${prefijo}-${n}`, descripcion_tango: "X", tipo: "con_anio", anio: 2020, precio, en_stock });
  }
});

test.afterAll(async () => {
  await limpiarDatos();
  await limpiarUsuarios();
});

test.beforeEach(async ({ context }) => {
  await entrarComo(context, "vendedor");
});

const lista = (page: Page) => page.getByRole("list", { name: "Destacados" });
const destacados = async (page: Page) =>
  (await lista(page).getByRole("listitem").getByRole("heading").allTextContents()).map((t) => t.replace(`${prefijo} `, ""));
const enCarta = async (page: Page) => {
  await page.goto(`/seccion/${ids.seccion}`);
  return (await page.getByRole("article").getByRole("heading").allTextContents()).map((t) => t.replace(`${prefijo} `, ""));
};
async function agregar(page: Page, texto: string, producto: string) {
  await page.getByLabel(`Agregar un producto de ${seccion}`).fill(texto);
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await page.getByRole("button", { name: `Agregar ${nombre(producto)}` }).click();
  await expect(lista(page).getByRole("heading", { name: nombre(producto) })).toBeVisible();
}

test("CA-3: desde Secciones se entra a los destacados; al principio no hay", async ({ page }) => {
  await page.goto("/admin/secciones");
  await page.getByRole("link", { name: seccion, exact: true }).click();
  await expect(page).toHaveURL(`/admin/secciones/${ids.seccion}`);
  await expect(page.getByRole("heading", { level: 1, name: `Destacados de ${seccion}` })).toBeVisible();
  await expect(page.getByText("Todavía no hay destacados en esta sección.")).toBeVisible();
  expect(await enCarta(page)).toEqual(["Alfa Malbec", "Beta Malbec", "Zeta Malbec"]);
});

test("CA-3: agrega destacados con el buscador; van primero en la carta", async ({ page }) => {
  await page.goto(`/admin/secciones/${ids.seccion}`);
  await agregar(page, "zeta malbec", "Zeta Malbec");
  await agregar(page, "beta", "Beta Malbec");
  expect(await destacados(page)).toEqual(["Zeta Malbec", "Beta Malbec"]);
  expect(await enCarta(page)).toEqual(["Zeta Malbec", "Beta Malbec", "Alfa Malbec"]);
});

test("CA-3: el buscador no ofrece productos de otra sección ni los que ya son destacados", async ({ page }) => {
  await page.goto(`/admin/secciones/${ids.seccion}`);
  await page.getByLabel(`Agregar un producto de ${seccion}`).fill("malbec");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  const resultados = page.getByRole("list", { name: "Resultados" });
  await expect(resultados.getByRole("button", { name: `Agregar ${nombre("Alfa Malbec")}` })).toBeVisible();
  await expect(resultados.getByRole("button", { name: `Agregar ${nombre("Malbec de otra sección")}` })).toHaveCount(0);
  await expect(resultados.getByRole("button", { name: `Agregar ${nombre("Zeta Malbec")}` })).toHaveCount(0);
});

test("CA-3: un destacado sin stock se marca, no se ve en la carta y conserva su lugar", async ({ page }) => {
  await page.goto(`/admin/secciones/${ids.seccion}`);
  await agregar(page, "gamma", "Gamma Malbec");
  await expect(lista(page).getByRole("listitem").filter({ hasText: nombre("Gamma Malbec") })).toContainText("No se ve en la carta");
  expect(await enCarta(page)).toEqual(["Zeta Malbec", "Beta Malbec", "Alfa Malbec"]);
  // Sigue en la lista del panel, en su lugar, para cuando vuelva a tener stock.
  await page.goto(`/admin/secciones/${ids.seccion}`);
  expect(await destacados(page)).toEqual(["Zeta Malbec", "Beta Malbec", "Gamma Malbec"]);
});

test("CA-3 y CA-4: ordena los destacados con el teclado", async ({ page }) => {
  await page.goto(`/admin/secciones/${ids.seccion}`);
  const manija = page.getByRole("button", { name: `Mover ${nombre("Beta Malbec")}` });
  await manija.focus();
  await page.keyboard.press("Space");
  await expect(manija).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(150); // dnd-kit escucha las flechas desde el próximo ciclo
  await page.keyboard.press("ArrowUp");
  await expect(page.getByText(`${nombre("Beta Malbec")}, posición 1 de 3.`, { exact: true })).toBeAttached();
  await page.keyboard.press("Space");
  await expect(page.getByRole("status").filter({ hasText: "Orden guardado" })).toBeVisible();
  expect(await destacados(page)).toEqual(["Beta Malbec", "Zeta Malbec", "Gamma Malbec"]);
  await page.reload();
  expect(await destacados(page)).toEqual(["Beta Malbec", "Zeta Malbec", "Gamma Malbec"]);
});

test("CA-3: quitar un destacado lo devuelve a su lugar automático", async ({ page }) => {
  await page.goto(`/admin/secciones/${ids.seccion}`);
  await page.getByRole("button", { name: `Quitar ${nombre("Beta Malbec")}` }).click();
  await expect(lista(page).getByRole("heading", { name: nombre("Beta Malbec") })).toHaveCount(0);
  expect(await destacados(page)).toEqual(["Zeta Malbec", "Gamma Malbec"]);
  expect(await enCarta(page)).toEqual(["Zeta Malbec", "Alfa Malbec", "Beta Malbec"]);
});
