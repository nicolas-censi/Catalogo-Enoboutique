import { expect, test } from "@playwright/test";

test("la página de inicio usa los colores y tipografías de marca", async ({ page }) => {
  await page.goto("/");

  const cuerpo = page.locator("body");
  // Spec 016: fondo crema y letras casi negras, como el panel.
  await expect(cuerpo).toHaveCSS("background-color", "rgb(246, 242, 233)");
  await expect(cuerpo).toHaveCSS("color", "rgb(27, 26, 23)");
  await expect(cuerpo).toHaveCSS("font-family", /Cabin/);

  // Las secciones (spec 013: sin título visible) en casi negro (spec 016: el dorado, solo en detalles).
  const titulo = page.getByRole("navigation", { name: "Secciones" }).getByRole("link").first();
  await expect(titulo).toHaveCSS("color", "rgb(27, 26, 23)");
  await expect(titulo).toHaveCSS("font-family", /Inknut Antiqua/);

  const fuentesCargadas = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family);
  });
  expect(fuentesCargadas.join(" ")).toMatch(/Inknut Antiqua/);
  expect(fuentesCargadas.join(" ")).toMatch(/Cabin/);
});
