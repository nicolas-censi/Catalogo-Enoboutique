import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { limpiarUsuarios } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// CA-10: el panel está pensado para la computadora y también se usa en el celular.
// Usa los datos de ejemplo del proyecto de desarrollo (Salentein Primus Malbec).
test.afterAll(limpiarUsuarios);

const pantallas: [string, string, boolean][] = [
  ["ingreso", "/admin/ingresar", false],
  ["contraseña olvidada", "/admin/olvide", false],
  ["productos", "/admin", true],
  ["nuevo producto", "/admin/productos/nuevo", true],
  ["ficha de producto", "/admin/productos/5eed0000-0000-4000-8000-000000000202", true],
  ["secciones", "/admin/secciones", true],
  ["personal", "/admin/personal", true],
];

const tamanos = [
  { nombre: "computadora", viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false },
  { nombre: "celular", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
];

async function revisar(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

for (const tamano of tamanos) {
  test.describe(`en ${tamano.nombre}`, () => {
    test.use({ viewport: tamano.viewport, isMobile: tamano.isMobile, hasTouch: tamano.hasTouch });

    for (const [nombre, ruta, conSesion] of pantallas) {
      test(`${nombre}: sin errores graves de accesibilidad${tamano.nombre === "celular" ? ", sin scroll horizontal y con elementos tocables de 44 px" : ""}`, async ({ page, context }) => {
        if (conSesion) await entrarComo(context, "encargado");
        await page.goto(ruta);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        expect(await revisar(page)).toEqual([]);

        if (tamano.nombre === "celular") {
          // Contra el ancho real del celular: al simularlo, el navegador puede ampliar la
          // página para que entre el contenido y window.innerWidth crece.
          const desborde = await page.evaluate((ancho) => document.documentElement.scrollWidth - ancho, tamano.viewport.width);
          expect(desborde, "scroll horizontal").toBeLessThanOrEqual(0);
          const chicos = await page.evaluate(() =>
            [...document.querySelectorAll<HTMLElement>("a, button, input:not([type=hidden]):not(.sr-only), select, textarea, label:has(> input.sr-only)")]
              .filter((el) => el.offsetParent !== null)
              .map((el) => ({ el, caja: el.getBoundingClientRect() }))
              .filter(({ el, caja }) => (el as HTMLInputElement).type !== "checkbox" && (caja.width < 44 || caja.height < 44))
              .map(({ el, caja }) => `${el.tagName} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30)}" ${Math.round(caja.width)}×${Math.round(caja.height)}`),
          );
          expect(chicos).toEqual([]);
        }
      });
    }
  });
}
