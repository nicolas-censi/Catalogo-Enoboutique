import { expect, test } from "@playwright/test";

test("la página de inicio usa los colores y tipografías de marca", async ({ page }) => {
  await page.goto("/");

  const cuerpo = page.locator("body");
  await expect(cuerpo).toHaveCSS("background-color", "rgb(247, 248, 251)");
  await expect(cuerpo).toHaveCSS("color", "rgb(0, 0, 0)");
  await expect(cuerpo).toHaveCSS("font-family", /Cabin/);

  const titulo = page.getByRole("heading", { level: 1 });
  await expect(titulo).toHaveCSS("color", "rgb(177, 151, 80)");
  await expect(titulo).toHaveCSS("font-family", /Inknut Antiqua/);

  const fuentesCargadas = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family);
  });
  expect(fuentesCargadas.join(" ")).toMatch(/Inknut Antiqua/);
  expect(fuentesCargadas.join(" ")).toMatch(/Cabin/);
});
