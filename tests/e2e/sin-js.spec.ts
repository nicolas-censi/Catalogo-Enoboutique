import { expect, test } from "@playwright/test";

// CA-9: el contenido de cada pantalla llega armado desde el servidor, así se ve
// aunque el celular no haya podido ejecutar JavaScript (señal mala en el local).
test.use({ javaScriptEnabled: false });

test("inicio, sección y detalle se ven sin JavaScript", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Secciones" }).getByRole("link", { name: "Cava" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Cava" })).toBeVisible();
  await page.getByRole("link", { name: "Rutini Malbec" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Rutini Malbec" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(5);
});
