import { expect, test, type Page } from "@playwright/test";

// Usa los datos de ejemplo del proyecto de desarrollo (npm run db:seed).

async function abrirProducto(page: Page, seccion: string, producto: string) {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Secciones" }).getByRole("link", { name: seccion }).click();
  await page.getByRole("link", { name: producto }).click();
  await expect(page).toHaveURL(/\/producto\/[0-9a-f-]{36}$/);
}

test("CA-3: el detalle muestra nombre, bodega, varietal y todas las añadas disponibles", async ({ page }) => {
  await abrirProducto(page, "Cava", "Rutini Malbec");
  await expect(page.getByRole("heading", { level: 1, name: "Rutini Malbec" })).toBeVisible();
  // Next.js 16 deja la página anterior oculta en memoria: se mira solo lo visible.
  await expect(page.getByText("Rutini · Malbec").filter({ visible: true })).toBeVisible();
  await expect(page.getByRole("main").getByRole("listitem")).toHaveText([
    /2023\s*\$\s*36\.000/,
    /2022\s*\$\s*40\.000/,
    /2021\s*\$\s*43\.000/,
    /2020\s*\$\s*47\.000/,
    /2018\s*\$\s*54\.000/,
  ]);
});

test("CA-3: el detalle tiene una dirección propia que se puede abrir directo", async ({ page }) => {
  await abrirProducto(page, "Destilados", "Glenmorangie Original");
  const direccion = page.url();
  await page.goto("about:blank");
  await page.goto(direccion);
  await expect(page.getByRole("heading", { level: 1, name: "Glenmorangie Original" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("listitem")).toHaveText([/^\s*\$\s*106\.000\s*$/]);
});

test("CA-3: sin foto ni descripción, el detalle se muestra igual", async ({ page }) => {
  await abrirProducto(page, "Almacén", "Sal gourmet Salva Malbec");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sal gourmet Salva Malbec");
  await expect(page.getByRole("main").getByRole("img")).toHaveCount(0);
});

test("CA-3: desde el detalle se vuelve a su sección", async ({ page }) => {
  await abrirProducto(page, "Cava", "Rutini Malbec");
  await page.getByRole("link", { name: "Volver a Cava" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Cava" })).toBeVisible();
});

test("CA-8: un producto no disponible muestra que no se encontró", async ({ page }) => {
  // Zuccardi Q Malbec Magnum está en la sección oculta "Próximamente".
  await page.goto("/producto/5eed0000-0000-4000-8000-000000000209");
  await expect(page.getByText("No encontramos este producto")).toBeVisible();
  await expect(page.getByText("Magnum")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Volver a la carta" })).toBeVisible();
});

test("CA-8: una dirección inválida muestra que no se encontró", async ({ page }) => {
  await page.goto("/producto/cualquier-cosa");
  await expect(page.getByText("No encontramos este producto")).toBeVisible();
});
