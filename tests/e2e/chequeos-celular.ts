import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

// Los mismos chequeos de admin-accesibilidad.spec.ts, para pantallas con datos.
export async function erroresGraves(page: Page): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

export async function desborde(page: Page, ancho = 390): Promise<number> {
  return page.evaluate((a) => document.documentElement.scrollWidth - a, ancho);
}

export async function tocablesChicos(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("a, button, input:not([type=hidden]):not(.sr-only), select, textarea, label:has(> input.sr-only)")]
      .filter((el) => el.offsetParent !== null)
      .map((el) => ({ el, caja: el.getBoundingClientRect() }))
      .filter(({ el, caja }) => (el as HTMLInputElement).type !== "checkbox" && (caja.width < 44 || caja.height < 44))
      .map(({ el, caja }) => `${el.tagName} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30)}" ${Math.round(caja.width)}×${Math.round(caja.height)}`),
  );
}
