import { expect, test, type Page } from "@playwright/test";
import { limpiarUsuarios } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// Spec 015, CA-1 y CA-2: al navegar por el panel no hay pantallazo negro, el menú queda
// fijo y mientras carga se ve "Cargando…".
test.afterAll(limpiarUsuarios);

/** Color de fondo efectivo en un punto de la pantalla (el primero no transparente). */
const fondoEn = (page: Page, x: number, y: number) =>
  page.evaluate(
    ([px, py]) => {
      let el: Element | null = document.elementFromPoint(px, py);
      while (el) {
        const c = getComputedStyle(el).backgroundColor;
        if (c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent") return c;
        el = el.parentElement;
      }
      return getComputedStyle(document.body).backgroundColor;
    },
    [x, y],
  );

for (const tamano of [
  { nombre: "computadora", viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false },
  { nombre: "celular", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
]) {
  test.describe(`en ${tamano.nombre}`, () => {
    test.use({ viewport: tamano.viewport, isMobile: tamano.isMobile, hasTouch: tamano.hasTouch });

    test("mientras carga la pantalla nueva: fondo del panel, Cargando… y el mismo menú", async ({ page, context }) => {
      await entrarComo(context, "vendedor");
      await page.goto("/admin");
      await page.waitForLoadState("networkidle");
      const menu = page.getByRole("navigation", { name: "Panel" });
      // Se marca el menú: si se volviera a armar, la marca desaparece.
      await menu.evaluate((el) => el.setAttribute("data-prueba", "el-mismo"));

      // Se demora la respuesta de la pantalla nueva para ver qué se muestra mientras tanto.
      await page.route("**/admin/secciones**", async (ruta) => {
        await new Promise((listo) => setTimeout(listo, 1500));
        await ruta.continue();
      });
      await menu.getByRole("link", { name: "Secciones" }).click();
      // Si el panel ya la había precargado, llega directo; si no, se ve "Cargando…".
      await expect(page.getByRole("status").filter({ hasText: "Cargando…" }).or(page.getByRole("heading", { level: 1, name: "Secciones" }))).toBeVisible();
      const centro = { x: tamano.viewport.width / 2, y: tamano.viewport.height / 2 };
      // Fondo del panel (crema) o una tarjeta del panel (blanca): nunca el negro de la carta.
      expect(["rgb(246, 242, 233)", "rgb(255, 255, 255)"]).toContain(await fondoEn(page, centro.x, centro.y));

      await expect(page.getByRole("heading", { level: 1, name: "Secciones" })).toBeVisible();
      await expect(menu).toHaveAttribute("data-prueba", "el-mismo");
      await expect(menu.getByRole("link", { name: "Secciones" })).toHaveAttribute("aria-current", "page");
    });
  });
}

test("el ingreso y \"No tenés acceso\" tienen el fondo del panel y no muestran el menú", async ({ page, context }) => {
  await page.goto("/admin/ingresar");
  // (No en una esquina: ahí está el indicador de desarrollo de Next.js.)
  expect(await fondoEn(page, 370, 600)).toBe("rgb(246, 242, 233)");
  await expect(page.getByRole("navigation", { name: "Panel" })).toHaveCount(0);
  await entrarComo(context);
  await page.goto("/admin");
  await expect(page.getByText("No tenés acceso al panel.")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Panel" })).toHaveCount(0);
});
