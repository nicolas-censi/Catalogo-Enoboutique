import { expect, test, type Page } from "@playwright/test";
import { aEmailInterno, contrasenaInterna } from "../../lib/admin/usuario";
import { clienteAdmin, clienteAnon, crearUsuarioConSesion, limpiarUsuarios, prefijo } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// Personal (spec 004, CA-12, con usuarios sin email de la spec 012): solo el encargado.
test.use({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false });
test.afterAll(limpiarUsuarios);

const admin = clienteAdmin();
const fila = (page: Page, usuario: string) =>
  page.getByRole("table", { name: "Personal" }).getByRole("row").filter({ has: page.getByRole("cell", { name: new RegExp(`^${usuario}( \\(vos\\))?$`) }) });
const idDe = async (usuario: string) => {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  return data.users.find((u) => u.email === aEmailInterno(usuario))?.id ?? null;
};
const rolDe = async (usuario: string) => {
  const id = await idDe(usuario);
  if (!id) return null;
  return (await admin.from("personal").select("rol").eq("user_id", id).maybeSingle()).data?.rol ?? "sin rol";
};
const puedeEntrar = async (usuario: string, contrasena: string) =>
  !(await clienteAnon().auth.signInWithPassword({ email: aEmailInterno(usuario), password: contrasenaInterna(contrasena) })).error;

async function ingresar(page: Page, usuario: string, contrasena: string) {
  await page.goto("/admin/ingresar");
  await page.getByLabel("Usuario").fill(usuario);
  await page.getByLabel("Contraseña").fill(contrasena);
  await page.getByRole("button", { name: "Ingresar" }).click();
}

test("un vendedor no tiene acceso a Personal", async ({ page, context }) => {
  await entrarComo(context, "vendedor");
  await page.goto("/admin");
  await expect(page.getByRole("navigation", { name: "Panel" }).getByRole("link", { name: "Personal" })).toHaveCount(0);
  await page.goto("/admin/personal");
  await expect(page.getByText("No tenés acceso al panel.")).toBeVisible();
  await expect(page.getByRole("table", { name: "Personal" })).toHaveCount(0);
});

test("spec 012, CA-2 y CA-4: el encargado da de alta a alguien con usuario y contraseña, y entra enseguida", async ({ page, context, browser }) => {
  const yo = await entrarComo(context, "encargado");
  await page.goto("/admin/personal");
  await expect(fila(page, yo.nombreUsuario)).toContainText("(vos)");
  await expect(page.getByText("@")).toHaveCount(0); // no se muestra ningún email

  const usuario = `${prefijo}-nuevo`;
  await page.getByLabel("Usuario", { exact: true }).fill(usuario.toUpperCase());
  await page.getByLabel("Contraseña", { exact: true }).fill("1234");
  await page.getByLabel("Rol", { exact: true }).selectOption("vendedor");
  await page.getByRole("button", { name: "Dar de alta" }).click();
  await expect(page.getByRole("status").filter({ hasText: "ya puede entrar" })).toHaveText(`Listo: ${usuario} ya puede entrar.`);
  await expect(fila(page, usuario)).toContainText("Vendedor");
  expect(await rolDe(usuario)).toBe("vendedor");

  // La persona entra desde su computadora con el usuario y la contraseña que le pasaron.
  const suya = await browser.newContext({ baseURL: "http://localhost:3100" });
  const pagina = await suya.newPage();
  await ingresar(pagina, usuario, "1234");
  await expect(pagina).toHaveURL(/\/admin$/);
  await expect(pagina.getByText(usuario, { exact: true })).toBeVisible(); // arriba del panel
  await suya.close();
});

test("spec 012, CA-2: valida el usuario, la contraseña y no repite usuarios", async ({ page, context }) => {
  await entrarComo(context, "encargado");
  const otro = await crearUsuarioConSesion("vendedor");
  await page.goto("/admin/personal");
  const campoUsuario = page.getByLabel("Usuario", { exact: true });
  const campoContrasena = page.getByLabel("Contraseña", { exact: true });

  await campoUsuario.fill("josé pérez");
  await campoContrasena.fill("123");
  await page.getByRole("button", { name: "Dar de alta" }).click();
  await expect(campoUsuario).toHaveAccessibleDescription(
    "El usuario tiene de 3 a 30 caracteres: letras sin tildes, números, punto, guion o guion bajo.",
  );
  await expect(campoContrasena).toHaveAccessibleDescription("La contraseña tiene que tener al menos 4 caracteres.");

  await campoUsuario.fill(otro.nombreUsuario);
  await campoContrasena.fill("1234");
  await page.getByRole("button", { name: "Dar de alta" }).click();
  await expect(campoUsuario).toHaveAccessibleDescription(`Ya existe el usuario ${otro.nombreUsuario}.`);
});

test("spec 012, CA-3: el encargado cambia la contraseña de alguien y la anterior deja de servir", async ({ page, context }) => {
  await entrarComo(context, "encargado");
  const otro = await crearUsuarioConSesion("vendedor");
  await page.goto("/admin/personal");
  await fila(page, otro.nombreUsuario).getByRole("button", { name: "Cambiar contraseña" }).click();
  await page.getByLabel(`Contraseña nueva de ${otro.nombreUsuario}`).fill("98");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByLabel(`Contraseña nueva de ${otro.nombreUsuario}`)).toHaveAccessibleDescription(
    "La contraseña tiene que tener al menos 4 caracteres.",
  );
  await page.getByLabel(`Contraseña nueva de ${otro.nombreUsuario}`).fill("9876");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(fila(page, otro.nombreUsuario).getByRole("status")).toHaveText("Contraseña cambiada.");
  expect(await puedeEntrar(otro.nombreUsuario, "9876")).toBe(true);
  expect(await puedeEntrar(otro.nombreUsuario, otro.password)).toBe(false);
});

test("spec 012, CA-3: el encargado también puede cambiar su propia contraseña", async ({ page, context }) => {
  const yo = await entrarComo(context, "encargado");
  await page.goto("/admin/personal");
  await fila(page, yo.nombreUsuario).getByRole("button", { name: "Cambiar contraseña" }).click();
  await page.getByLabel(`Contraseña nueva de ${yo.nombreUsuario}`).fill("4321");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(fila(page, yo.nombreUsuario).getByRole("status")).toHaveText("Contraseña cambiada.");
  expect(await puedeEntrar(yo.nombreUsuario, "4321")).toBe(true);
});

test("el encargado cambia el rol de otra persona, pero no el propio", async ({ page, context }) => {
  const yo = await entrarComo(context, "encargado");
  const otro = await crearUsuarioConSesion("vendedor");
  await page.goto("/admin/personal");
  await expect(fila(page, yo.nombreUsuario).getByRole("combobox")).toBeDisabled();
  await fila(page, otro.nombreUsuario).getByRole("combobox", { name: `Rol de ${otro.nombreUsuario}` }).selectOption("encargado");
  await expect.poll(() => rolDe(otro.nombreUsuario)).toBe("encargado");
  await expect(fila(page, otro.nombreUsuario).getByRole("status")).toHaveText("Guardado.");
});

test("da de baja a alguien con confirmación y ya no puede entrar", async ({ page, context }) => {
  const yo = await entrarComo(context, "encargado");
  const otro = await crearUsuarioConSesion("vendedor");
  await page.goto("/admin/personal");
  await expect(fila(page, yo.nombreUsuario).getByRole("button", { name: "Dar de baja" })).toHaveCount(0);

  await fila(page, otro.nombreUsuario).getByRole("button", { name: "Dar de baja" }).click();
  await expect(fila(page, otro.nombreUsuario)).toContainText(`¿Dar de baja a ${otro.nombreUsuario}? No va a poder entrar más.`);
  await fila(page, otro.nombreUsuario).getByRole("button", { name: "Sí, dar de baja" }).click();
  await expect(fila(page, otro.nombreUsuario)).toHaveCount(0);
  expect(await rolDe(otro.nombreUsuario)).toBeNull();
  expect(await puedeEntrar(otro.nombreUsuario, otro.password)).toBe(false);
});
