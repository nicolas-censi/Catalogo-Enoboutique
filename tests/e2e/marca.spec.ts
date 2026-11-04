import { expect, test } from "@playwright/test";

test("la página de inicio usa los colores y tipografías de marca", async ({ page }) => {
  await page.goto("/");

  const cuerpo = page.locator("body");
  await expect(cuerpo).toHaveCSS("background-color", "rgb(0, 0, 0)");
  await expect(cuerpo).toHaveCSS("color", "rgb(243, 237, 224)");
  await expect(cuerpo).toHaveCSS("font-family", /Cabin/);

  // Las secciones (spec 013: sin título visible) en el dorado del logo.
  const titulo = page.getByRole("navigation", { name: "Secciones" }).getByRole("link").first();
  await expect(titulo).toHaveCSS("color", "rgb(177, 151, 80)");
  await expect(titulo).toHaveCSS("font-family", /Inknut Antiqua/);

  const fuentesCargadas = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family);
  });
  expect(fuentesCargadas.join(" ")).toMatch(/Inknut Antiqua/);
  expect(fuentesCargadas.join(" ")).toMatch(/Cabin/);
});
