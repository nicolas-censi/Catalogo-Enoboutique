import { expect, test } from "@playwright/test";
import { camaraSimulada } from "./video-codigo";

// CA-3 (spec 003): un código válido que no está en la carta.
test.use(camaraSimulada("7790001234568"));

test("CA-3: avisa que no está, con el número leído, y deja reintentar o buscar", async ({ page }) => {
  await page.goto("/escanear");
  const estado = page.getByRole("status");
  await expect(estado).toHaveText("No encontramos ese código en la carta.", { timeout: 20_000 });
  await expect(page.getByText("Código leído: 7790001234568")).toBeVisible();
  await expect(page).toHaveURL(/\/escanear$/);

  await page.getByRole("button", { name: "Escanear de nuevo" }).click();
  await expect(page.locator("video")).toBeVisible();
  await expect(estado).toHaveText("No encontramos ese código en la carta.", { timeout: 20_000 });

  await page.getByRole("link", { name: "Buscar por nombre" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("searchbox")).toBeVisible();
});
