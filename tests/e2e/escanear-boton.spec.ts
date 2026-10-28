import { expect, test } from "@playwright/test";

// CA-1 y CA-4 (spec 003). Usa los datos de ejemplo (Salentein Primus Malbec).

test("CA-1: el inicio tiene un botón circular para escanear al costado del buscador", async ({ page }) => {
  await page.goto("/");
  const boton = page.getByRole("link", { name: "Escanear código" });
  await expect(boton).toBeVisible();
  await expect(boton).toHaveAttribute("href", "/escanear");
  await expect(boton.locator("svg")).toBeVisible();
  const caja = (await boton.boundingBox())!;
  // Círculo: radio de al menos la mitad del ancho (Tailwind 4 usa un radio enorme).
  const radio = parseFloat(await boton.evaluate((el) => getComputedStyle(el).borderTopLeftRadius));
  expect(radio).toBeGreaterThanOrEqual(caja.width / 2);
  expect(caja.width).toBeGreaterThanOrEqual(44);
  expect(Math.abs(caja.width - caja.height)).toBeLessThanOrEqual(1);
  const buscador = (await page.getByRole("searchbox").boundingBox())!;
  // En la misma fila que el buscador.
  expect(Math.abs(caja.y + caja.height / 2 - (buscador.y + buscador.height / 2))).toBeLessThanOrEqual(4);
});

test("CA-1: el botón aparece solo en el inicio", async ({ page }) => {
  await page.goto("/buscar?q=rutini");
  await expect(page.getByRole("link", { name: "Escanear código" })).toHaveCount(0);
});

test.describe("sin JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("CA-4: la página del escáner ofrece escribir el número y lleva al producto", async ({ page }) => {
    await page.goto("/escanear");
    await expect(page.getByRole("heading", { level: 1, name: "Escanear código" })).toBeVisible();
    await page.getByLabel("Número del código de barras", { exact: true }).fill("7798074860141");
    await page.getByRole("button", { name: "Buscar" }).click();
    await expect(page).toHaveURL(/\/buscar\?q=7798074860141$/);
    await expect(page.getByRole("article").getByRole("heading")).toHaveText(["Salentein Primus Malbec"]);
  });

  test("se puede volver a la carta", async ({ page }) => {
    await page.goto("/escanear");
    await page.getByRole("link", { name: "Volver a la carta" }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
