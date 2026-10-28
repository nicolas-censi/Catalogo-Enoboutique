import { expect, test } from "@playwright/test";
import { aEmailInterno, contrasenaInterna } from "../../lib/admin/usuario";
import { clienteAdmin, clienteAnon, crearUsuarioConSesion, limpiarUsuarios } from "../db/ayudante";
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

test("spec 012, CA-1: con usuario o contraseña incorrectos muestra un error genérico", async ({ page }) => {
  await page.goto("/admin/ingresar");
  await page.getByLabel("Usuario").fill("nadie");
  await page.getByLabel("Contraseña").fill("incorrecta");
  await page.getByRole("button", { name: "Ingresar" }).click();
  // Next.js tiene su propio role="alert" (anuncia cambios de ruta): se filtra por texto.
  await expect(page.getByRole("alert").filter({ hasText: "incorrectos" })).toHaveText("Usuario o contraseña incorrectos.");
  await expect(page).toHaveURL(/\/admin\/ingresar$/);
});

test("spec 012, CA-1: no pide email y explica qué hacer si te olvidaste la contraseña", async ({ page }) => {
  await page.goto("/admin/ingresar");
  await expect(page.getByLabel("Email")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Olvidé mi contraseña" })).toHaveCount(0);
  await expect(page.getByText("¿Te olvidaste la contraseña? Pedile al encargado que te la cambie.")).toBeVisible();
});

test("spec 012, CA-1: el personal ingresa con su usuario (sin importar mayúsculas) y puede cerrar sesión", async ({ page }) => {
  const { nombreUsuario, password } = await crearUsuarioConSesion("vendedor");
  await page.goto("/admin/ingresar");
  await page.getByLabel("Usuario").fill(` ${nombreUsuario.toUpperCase()} `);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("navigation", { name: "Panel" })).toBeVisible();

  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL(/\/admin\/ingresar$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/ingresar$/);
});

test("spec 012, CA-5: una cuenta con la contraseña de antes entra y queda actualizada", async ({ page }) => {
  const { usuario, nombreUsuario } = await crearUsuarioConSesion("vendedor");
  // Contraseña guardada como antes del cambio (sin el agregado interno).
  await clienteAdmin().auth.admin.updateUserById(usuario.id, { password: "vieja123" });
  await page.goto("/admin/ingresar");
  await page.getByLabel("Usuario").fill(nombreUsuario);
  await page.getByLabel("Contraseña").fill("vieja123");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  // Ya quedó con la contraseña interna.
  const prueba = await clienteAnon().auth.signInWithPassword({ email: aEmailInterno(nombreUsuario), password: contrasenaInterna("vieja123") });
  expect(prueba.error).toBeNull();
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
