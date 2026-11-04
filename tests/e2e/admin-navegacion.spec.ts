import { expect, test } from "@playwright/test";
import { limpiarUsuarios } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// Spec 014, CA-1: menú del panel (lateral en la computadora, barra abajo en el celular).
test.afterAll(limpiarUsuarios);
const menu = (page: import("@playwright/test").Page) => page.getByRole("navigation", { name: "Panel" });

test.describe("en la computadora", () => {
  test.use({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false });

  test("el encargado ve Productos, Secciones, Para revisar y Ajustes; la opción actual queda marcada", async ({ page, context }) => {
    await entrarComo(context, "encargado");
    await page.goto("/admin");
    for (const nombre of ["Productos", "Secciones", /^Para revisar/, "Ajustes"]) await expect(menu(page).getByRole("link", { name: nombre })).toBeVisible();
    await expect(menu(page).getByRole("link", { name: "Productos" })).toHaveAttribute("aria-current", "page");
    // Lo de vez en cuando no está en el menú: está en Ajustes.
    for (const nombre of ["Importar", "Promociones", "Marca", "IA", "Personal"]) await expect(menu(page).getByRole("link", { name: nombre, exact: true })).toHaveCount(0);
    await expect(menu(page).getByRole("link", { name: "Ver la carta" })).toBeVisible();
    await expect(menu(page).getByRole("button", { name: "Salir" })).toBeVisible();

    await menu(page).getByRole("link", { name: "Ajustes" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Ajustes" })).toBeVisible();
    await expect(menu(page).getByRole("link", { name: "Ajustes" })).toHaveAttribute("aria-current", "page");
    for (const nombre of ["Importar desde Tango", "Promociones", "Marca", "IA", "Personal"]) await expect(page.getByRole("main").getByRole("link", { name: new RegExp(`^${nombre}`) })).toBeVisible();
    await page.getByRole("main").getByRole("link", { name: /^Personal/ }).click();
    await expect(page).toHaveURL(/\/admin\/personal$/);
    // Dentro de una pantalla de Ajustes, Ajustes sigue marcado.
    await expect(menu(page).getByRole("link", { name: "Ajustes" })).toHaveAttribute("aria-current", "page");
  });

  test("el vendedor ve Cuenta en lugar de Ajustes, sin las opciones del encargado", async ({ page, context }) => {
    await entrarComo(context, "vendedor");
    await page.goto("/admin/ajustes");
    await expect(page.getByRole("heading", { level: 1, name: "Cuenta" })).toBeVisible();
    await expect(menu(page).getByRole("link", { name: "Cuenta" })).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: /^Importar/ })).toHaveCount(0);
  });
});

test.describe("en el celular", () => {
  test("barra fija abajo con las opciones; la cuenta y Salir están en Ajustes", async ({ page, context }) => {
    await entrarComo(context, "encargado");
    await page.goto("/admin/secciones");
    const barra = menu(page);
    const caja = await barra.boundingBox();
    expect(caja!.y + caja!.height).toBeGreaterThanOrEqual(844 - 1);
    await expect(barra.getByRole("link", { name: "Secciones" })).toHaveAttribute("aria-current", "page");
    await expect(barra.getByRole("button", { name: "Salir" })).toBeHidden();
    await barra.getByRole("link", { name: "Ajustes" }).click();
    await expect(page.getByRole("main").getByRole("button", { name: "Salir" })).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: "Ver la carta" })).toBeVisible();
  });
});
