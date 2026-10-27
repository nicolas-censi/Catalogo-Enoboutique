import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// CA-11: accesibilidad y tamaño de los elementos tocables en cada pantalla.
// Usa los datos de ejemplo del proyecto de desarrollo (npm run db:seed).

async function irA(page: Page, pantalla: string) {
  await page.goto("/");
  if (pantalla === "inicio") return;
  if (pantalla === "busqueda") return void (await page.goto("/buscar?q=rutini"));
  if (pantalla === "sin resultados") return void (await page.goto("/buscar?q=heladera"));
  await page.getByRole("link", { name: "Cava" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Cava" })).toBeVisible();
  if (pantalla === "sección") return;
  await page.getByRole("link", { name: "Rutini Malbec" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Rutini Malbec" })).toBeVisible();
}

const pantallas = ["inicio", "sección", "detalle", "busqueda", "sin resultados"];

for (const pantalla of pantallas) {
  test(`${pantalla}: axe no reporta errores graves`, async ({ page }) => {
    await irA(page, pantalla);
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      // Next.js 16 deja la página anterior oculta en memoria: se revisa la visible.
      .include("body")
      .analyze();
    const graves = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(
      graves.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
    ).toEqual([]);
  });

  test(`${pantalla}: los elementos tocables miden al menos 44×44 px`, async ({ page }) => {
    await irA(page, pantalla);
    const chicos = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("a, button, input, select, textarea")]
        .filter((el) => el.offsetParent !== null)
        .map((el) => ({ el, caja: el.getBoundingClientRect() }))
        .filter(({ caja }) => caja.width < 44 || caja.height < 44)
        .map(({ el, caja }) => `${el.tagName} "${el.textContent?.trim() || el.getAttribute("aria-label")}" ${Math.round(caja.width)}×${Math.round(caja.height)}`),
    );
    expect(chicos).toEqual([]);
  });
}
