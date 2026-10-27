import { expect, test, type Page } from "@playwright/test";
import { clienteAdmin, crearUsuarioConSesion, limpiarUsuarios, prefijo } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// CA-12: alta y baja de personal (solo el encargado). Las invitaciones no mandan mails
// en los tests (MAILS_DE_PRUEBA=1): el enlace se genera con la API.
test.use({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false });
test.afterAll(limpiarUsuarios);

const admin = clienteAdmin();
const fila = (page: Page, email: string) => page.getByRole("table", { name: "Personal" }).getByRole("row").filter({ hasText: email });
const rolDe = async (email: string) => {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const usuario = data.users.find((u) => u.email === email);
  if (!usuario) return null;
  return (await admin.from("personal").select("rol").eq("user_id", usuario.id).maybeSingle()).data?.rol ?? "sin rol";
};

test("CA-12: un vendedor no tiene acceso a Personal", async ({ page, context }) => {
  await entrarComo(context, "vendedor");
  await page.goto("/admin");
  await expect(page.getByRole("navigation", { name: "Panel" }).getByRole("link", { name: "Personal" })).toHaveCount(0);
  await page.goto("/admin/personal");
  await expect(page.getByText("No tenés acceso al panel.")).toBeVisible();
  await expect(page.getByRole("table", { name: "Personal" })).toHaveCount(0);
});

test("CA-12: el encargado invita a alguien, que elige su contraseña y entra", async ({ page, context, browser }) => {
  const yo = await entrarComo(context, "encargado");
  await page.goto("/admin/personal");
  await expect(fila(page, yo.email)).toContainText("(vos)");

  const email = `${prefijo}-nuevo@example.com`;
  await page.getByLabel("Email de la persona", { exact: true }).fill(email);
  await page.getByLabel("Rol", { exact: true }).selectOption("vendedor");
  await page.getByRole("button", { name: "Invitar" }).click();
  await expect(page.getByRole("status")).toHaveText(`Le mandamos la invitación a ${email}.`);
  await expect(fila(page, email)).toContainText("Invitación pendiente");
  await expect(fila(page, email)).toContainText("Vendedor");
  expect(await rolDe(email)).toBe("vendedor");

  // La persona abre el enlace de la invitación en su computadora.
  const { data } = await admin.auth.admin.generateLink({ type: "recovery", email });
  const suya = await browser.newContext({ baseURL: "http://localhost:3100" });
  const pagina = await suya.newPage();
  await pagina.goto(`/admin/restablecer/confirmar?token_hash=${data.properties!.hashed_token}&type=recovery`);
  await pagina.getByLabel("Contraseña nueva", { exact: true }).fill("Torrontes-2026");
  await pagina.getByLabel("Repetí la contraseña", { exact: true }).fill("Torrontes-2026");
  await pagina.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(pagina).toHaveURL(/\/admin$/);
  await expect(pagina.getByRole("navigation", { name: "Panel" })).toBeVisible();
  await suya.close();

  await page.reload();
  await expect(fila(page, email)).toContainText("Activa");
});

test("CA-12: no invita a alguien que ya es del personal ni un email inválido", async ({ page, context }) => {
  await entrarComo(context, "encargado");
  const otro = await crearUsuarioConSesion("vendedor");
  await page.goto("/admin/personal");
  await page.getByLabel("Email de la persona", { exact: true }).fill(otro.email);
  await page.getByRole("button", { name: "Invitar" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "personal" })).toHaveText(`${otro.email} ya es del personal.`);

  await page.getByLabel("Email de la persona", { exact: true }).fill("no-es-un-email");
  await page.getByRole("button", { name: "Invitar" }).click();
  await expect(page.getByLabel("Email de la persona", { exact: true })).toHaveAccessibleDescription("Escribí un email válido.");
});

test("CA-12: el encargado cambia el rol de otra persona, pero no el propio", async ({ page, context }) => {
  const yo = await entrarComo(context, "encargado");
  const otro = await crearUsuarioConSesion("vendedor");
  await page.goto("/admin/personal");
  await expect(fila(page, yo.email).getByRole("combobox")).toBeDisabled();
  await fila(page, otro.email).getByRole("combobox", { name: `Rol de ${otro.email}` }).selectOption("encargado");
  await expect.poll(() => rolDe(otro.email)).toBe("encargado");
  await expect(fila(page, otro.email).getByRole("status")).toHaveText("Guardado.");
});

test("CA-12: da de baja a alguien con confirmación y ya no puede entrar", async ({ page, context }) => {
  const yo = await entrarComo(context, "encargado");
  const otro = await crearUsuarioConSesion("vendedor");
  await page.goto("/admin/personal");
  await expect(fila(page, yo.email).getByRole("button", { name: "Dar de baja" })).toHaveCount(0);

  await fila(page, otro.email).getByRole("button", { name: "Dar de baja" }).click();
  await expect(fila(page, otro.email)).toContainText(`¿Dar de baja a ${otro.email}? No va a poder entrar más.`);
  await fila(page, otro.email).getByRole("button", { name: "Sí, dar de baja" }).click();
  await expect(fila(page, otro.email)).toHaveCount(0);
  expect(await rolDe(otro.email)).toBeNull();

  const { error } = await clienteAdmin().auth.signInWithPassword({ email: otro.email, password: otro.password });
  expect(error).not.toBeNull();
});
