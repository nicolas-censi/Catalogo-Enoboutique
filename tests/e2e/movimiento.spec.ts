import { expect, test } from "@playwright/test";

// Spec 013, CA-3: los vinos aparecen con una animación, salvo con "reducir movimiento".
const CAVA = "/seccion/5eed0000-0000-4000-8000-000000000101";

test("CA-3: los vinos aparecen escalonados", async ({ page }) => {
  await page.goto(CAVA);
  const vinos = page.getByRole("article");
  await expect(vinos.first()).toHaveCSS("animation-name", "aparecer");
  const demoras = await vinos.evaluateAll((a) => a.slice(0, 2).map((el) => getComputedStyle(el).animationDelay));
  expect(demoras).toEqual(["0s", "0.04s"]);
});

test.describe("con reducir movimiento", () => {
  test.use({ reducedMotion: "reduce" });
  test("CA-3: no hay animaciones", async ({ page }) => {
    await page.goto(CAVA);
    await expect(page.getByRole("article").first()).toHaveCSS("animation-name", "none");
  });
});
