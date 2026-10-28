import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { clienteAdmin, limpiarDatos, limpiarUsuarios, prefijo } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// Spec 011, CA-3 y CA-5: las pantallas con subsecciones en el celular.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

const admin = clienteAdmin();
const n = (nombre: string) => `${prefijo} ${nombre}`;
let cava = "";

test.beforeAll(async () => {
  cava = (await admin.from("secciones").insert({ nombre: n("Cava celular"), orden: 80000 }).select().single()).data!.id;
  for (const [i, sub] of ["Joyitas", "Añadas", "Experiencias"].entries()) {
    const hija = (await admin.from("secciones").insert({ nombre: n(sub), orden: i + 1, seccion_padre_id: cava }).select().single()).data!.id;
    const p = (await admin.from("productos").insert({ tipo: "vino", nombre: n(`Vino ${sub}`), seccion_id: hija }).select().single()).data!.id;
    await admin.from("anadas").insert({ producto_id: p, codigo_tango: `${prefijo}-cel-${i}`, descripcion_tango: "X", tipo: "con_anio", anio: 2020, precio: 1000, en_stock: true });
  }
});

test.afterAll(async () => {
  await limpiarDatos();
  await limpiarUsuarios();
});

async function revisar(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - 390), "scroll horizontal").toBeLessThanOrEqual(0);
  const chicos = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("main a, main button, main input:not([type=hidden]), main select")]
      .filter((el) => el.offsetParent !== null && (el as HTMLInputElement).type !== "checkbox")
      .map((el) => ({ el, caja: el.getBoundingClientRect() }))
      .filter(({ caja }) => caja.width < 44 || caja.height < 44)
      .map(({ el, caja }) => `${el.tagName} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30)}" ${Math.round(caja.width)}×${Math.round(caja.height)}`),
  );
  expect(chicos).toEqual([]);
}

test("CA-3: la sección de la carta con subsecciones, en el celular", async ({ page }) => {
  await page.goto(`/seccion/${cava}`);
  await expect(page.getByRole("navigation", { name: "Subsecciones" })).toBeVisible();
  await revisar(page);
});

test("CA-5: la pantalla de la sección en el panel, en el celular", async ({ page, context }) => {
  await entrarComo(context, "vendedor");
  await page.goto(`/admin/secciones/${cava}`);
  await expect(page.getByRole("table", { name: "Subsecciones" })).toBeVisible();
  await revisar(page);
});
