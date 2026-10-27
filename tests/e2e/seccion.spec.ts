import { expect, test, type Page } from "@playwright/test";

// Usa los datos de ejemplo del proyecto de desarrollo (npm run db:seed).

async function abrirSeccion(page: Page, nombre: string) {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Secciones" }).getByRole("link", { name: nombre }).click();
  await expect(page).toHaveURL(/\/seccion\/[0-9a-f-]{36}$/);
}

const producto = (page: Page, nombre: string) => page.getByRole("article").filter({ has: page.getByRole("heading", { name: nombre }) });

test("CA-2: la sección muestra sus productos en orden", async ({ page }) => {
  await abrirSeccion(page, "Cava");
  await expect(page.getByRole("heading", { level: 1, name: "Cava" })).toBeVisible();
  await expect(page.getByRole("article").getByRole("heading")).toHaveText([
    "Rutini Malbec",
    "Salentein Primus Malbec",
  ]);
});

test("CA-2 y CA-4: cada producto muestra bodega, varietal y añadas con precio, de la más nueva a la más vieja", async ({ page }) => {
  await abrirSeccion(page, "Cava");
  const rutini = producto(page, "Rutini Malbec");
  await expect(rutini.getByText("Rutini · Malbec")).toBeVisible();
  await expect(rutini.getByRole("listitem")).toHaveText([
    /2023\s*\$\s*36\.000/,
    /2022\s*\$\s*40\.000/,
    /2021\s*\$\s*43\.000/,
    /2020\s*\$\s*47\.000/,
    /2018\s*\$\s*54\.000/,
  ]);
  // La 2017 no tiene stock.
  await expect(rutini.getByText("2017")).toHaveCount(0);
});

test("CA-4: una añada sin especificar se muestra sin año, al final", async ({ page }) => {
  await abrirSeccion(page, "Cava");
  const primus = producto(page, "Salentein Primus Malbec");
  await expect(primus.getByRole("listitem").last()).toHaveText(/^\s*\$\s*70\.800\s*$/);
});

test('CA-4: una añada sin precio muestra "Consultar precio"', async ({ page }) => {
  await abrirSeccion(page, "Blancos");
  await expect(producto(page, "Costa & Pampa Sauvignon Blanc").getByRole("listitem")).toHaveText([
    /2016\s*Consultar precio/,
  ]);
});

test("CA-4: un producto sin añada muestra solo el precio", async ({ page }) => {
  await abrirSeccion(page, "Destilados");
  await expect(producto(page, "Glenmorangie Original").getByRole("listitem")).toHaveText([/^\s*\$\s*106\.000\s*$/]);
});

test("cada producto lleva a su detalle y se puede volver al inicio", async ({ page }) => {
  await abrirSeccion(page, "Cava");
  await expect(producto(page, "Rutini Malbec").getByRole("link")).toHaveAttribute("href", /^\/producto\/[0-9a-f-]{36}$/);
  await page.getByRole("link", { name: "Volver a la carta" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("una sección que no existe muestra que no se encontró", async ({ page }) => {
  await page.goto("/seccion/00000000-0000-4000-8000-000000000000");
  await expect(page.getByText("No encontramos esta sección")).toBeVisible();
});
