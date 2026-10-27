import { expect, test } from "@playwright/test";
import { clienteAdmin, crearUsuarioConSesion, limpiarUsuarios } from "../db/ayudante";

// CA-1b: contraseña olvidada. No se mandan mails reales: el enlace se genera con la API
// de administración, igual al que llega por mail.
test.use({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false });
test.afterAll(limpiarUsuarios);

async function enlaceDeRecuperacion(email: string) {
  const { data, error } = await clienteAdmin().auth.admin.generateLink({ type: "recovery", email });
  if (error) throw error;
  return `/admin/restablecer/confirmar?token_hash=${data.properties.hashed_token}&type=recovery`;
}

test("CA-1b: desde el ingreso se llega a pedir el enlace; el mensaje no revela si el email existe", async ({ page }) => {
  await page.goto("/admin/ingresar");
  await page.getByRole("link", { name: "Olvidé mi contraseña" }).click();
  await expect(page).toHaveURL(/\/admin\/olvide$/);
  // getByRole ignora la página de ingreso que Next.js 16 deja oculta en memoria.
  await page.getByRole("textbox", { name: "Email" }).fill("nadie-que-exista@example.com");
  await page.getByRole("button", { name: "Mandarme el enlace" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Si el email es del personal, te mandamos un enlace para elegir una contraseña nueva.",
  );
});

test("CA-1b: con el enlace se elige una contraseña nueva y con ella se ingresa", async ({ page, context }) => {
  const { email } = await crearUsuarioConSesion("vendedor");
  await page.goto(await enlaceDeRecuperacion(email));
  await expect(page).toHaveURL(/\/admin\/restablecer$/);
  await expect(page.getByRole("heading", { name: "Elegí tu contraseña" })).toBeVisible();

  const nueva = "Malbec-2026-Cava";
  await page.getByLabel("Contraseña nueva", { exact: true }).fill(nueva);
  await page.getByLabel("Repetí la contraseña", { exact: true }).fill(nueva);
  await page.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await context.clearCookies();
  await page.goto("/admin/ingresar");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(nueva);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
});

test("CA-1b: avisa si las contraseñas no coinciden o son cortas", async ({ page }) => {
  const { email } = await crearUsuarioConSesion("vendedor");
  await page.goto(await enlaceDeRecuperacion(email));
  const contrasena = page.getByLabel("Contraseña nueva", { exact: true });
  await contrasena.fill("corta");
  await page.getByLabel("Repetí la contraseña", { exact: true }).fill("corta");
  await page.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(contrasena).toHaveAccessibleDescription("Tiene que tener al menos 8 caracteres.");

  await contrasena.fill("Malbec-2026-Cava");
  await page.getByLabel("Repetí la contraseña", { exact: true }).fill("Malbec-2026-Otra");
  await page.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(page.getByLabel("Repetí la contraseña", { exact: true })).toHaveAccessibleDescription("Las contraseñas no coinciden.");
  await expect(page).toHaveURL(/\/admin\/restablecer$/);
});

test("CA-1b: un enlace vencido o ya usado lo dice y ofrece pedir otro", async ({ page }) => {
  await page.goto("/admin/restablecer/confirmar?token_hash=no-existe&type=recovery");
  await expect(page).toHaveURL(/\/admin\/restablecer$/);
  await expect(page.getByText("El enlace venció o ya se usó.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Pedir un enlace nuevo" })).toHaveAttribute("href", "/admin/olvide");
});
