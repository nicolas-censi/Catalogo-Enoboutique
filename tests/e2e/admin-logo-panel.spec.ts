import { expect, test } from "@playwright/test";
import { limpiarUsuarios } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// Spec 017, CA-1: el logo de la marca arriba del menú del panel (en la computadora).
test.afterAll(limpiarUsuarios);

test.describe("en la computadora", () => {
  test.use({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false });

  test("arriba del menú se ve el logo, no el texto \"Lehonor\"", async ({ page, context }) => {
    await entrarComo(context, "vendedor");
    await page.goto("/admin");
    const menu = page.getByRole("navigation", { name: "Panel" });
    const logo = menu.getByRole("img", { name: "Lehonor Enoboutique" });
    await expect(logo).toBeVisible();
    const caja = (await logo.boundingBox())!;
    expect(Math.round(caja.height)).toBe(40);
    await expect(menu.getByText("Lehonor", { exact: true })).toHaveCount(0);
  });
});

test("en el celular la barra de abajo no muestra el logo", async ({ page, context }) => {
  await entrarComo(context, "vendedor");
  await page.goto("/admin");
  await expect(page.getByRole("navigation", { name: "Panel" }).getByRole("img", { name: "Lehonor Enoboutique" })).not.toBeVisible();
});
