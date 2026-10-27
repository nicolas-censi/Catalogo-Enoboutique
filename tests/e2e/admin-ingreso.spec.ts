import { expect, test } from "@playwright/test";
import { crearUsuarioConSesion, limpiarUsuarios } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// CA-1: ingreso solo para el personal. El panel se usa sobre todo en computadora.
test.use({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false });
test.afterAll(limpiarUsuarios);

test("sin sesión, /admin lleva al ingreso y no muestra nada del panel", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/ingresar$/);
  await expect(page.getByRole("heading", { name: "Ingresar al panel" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Productos" })).toHaveCount(0);
});

test("con email o contraseña incorrectos muestra un error", async ({ page }) => {
  await page.goto("/admin/ingresar");
  await page.getByLabel("Email").fill("nadie@example.com");
  await page.getByLabel("Contraseña").fill("incorrecta");
  await page.getByRole("button", { name: "Ingresar" }).click();
  // Next.js tiene su propio role="alert" (anuncia cambios de ruta): se filtra por texto.
  await expect(page.getByRole("alert").filter({ hasText: "incorrectos" })).toHaveText("Email o contraseña incorrectos.");
  await expect(page).toHaveURL(/\/admin\/ingresar$/);
});

test("el personal ingresa con el formulario y puede cerrar sesión", async ({ page }) => {
  const { email, password } = await crearUsuarioConSesion("vendedor");
  await page.goto("/admin/ingresar");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("navigation", { name: "Panel" })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();

  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL(/\/admin\/ingresar$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/ingresar$/);
});

test("alguien con sesión que no es del personal ve que no tiene acceso", async ({ page, context }) => {
  await entrarComo(context);
  await page.goto("/admin");
  await expect(page.getByText("No tenés acceso al panel.")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Panel" })).toHaveCount(0);
});

test("si ya inició sesión, /admin/ingresar lleva al panel", async ({ page, context }) => {
  await entrarComo(context, "encargado");
  await page.goto("/admin/ingresar");
  await expect(page).toHaveURL(/\/admin$/);
});

test("el panel no aparece en buscadores", async ({ page }) => {
  await page.goto("/admin/ingresar");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
