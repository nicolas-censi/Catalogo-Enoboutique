import { expect, test, type Page } from "@playwright/test";
import { clienteAdmin, limpiarUsuarios, prefijo } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// Spec 006: bienvenida y logo desde el panel. La fila de marca es la real de la base de
// desarrollo: se guarda como estaba y se restaura al final.
test.use({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false });
test.describe.configure({ mode: "serial" });

const admin = clienteAdmin();
let original: { bienvenida: string | null; logo_path: string | null };
// PNG de 1×1 transparente.
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

test.beforeAll(async () => {
  original = (await admin.from("marca").select("bienvenida, logo_path").eq("id", 1).single()).data!;
});

test.afterAll(async () => {
  const actual = (await admin.from("marca").select("logo_path").eq("id", 1).single()).data!;
  if (actual.logo_path && actual.logo_path !== original.logo_path) await admin.storage.from("marca").remove([actual.logo_path]);
  await admin.from("marca").update(original).eq("id", 1);
  await limpiarUsuarios();
});

const logoDeLaCarta = (page: Page) => page.getByRole("banner").getByRole("img", { name: "Lehonor Enoboutique" });

test("CA-3: un vendedor no tiene acceso a Marca", async ({ page, context }) => {
  await entrarComo(context, "vendedor");
  await page.goto("/admin");
  await expect(page.getByRole("navigation", { name: "Panel" }).getByRole("link", { name: "Marca" })).toHaveCount(0);
  await page.goto("/admin/marca");
  await expect(page.getByText("No tenés acceso al panel.")).toBeVisible();
});

test("spec 016, CA-3: el logo actual se muestra sobre el fondo crema de la carta", async ({ page, context }) => {
  await entrarComo(context, "encargado");
  await page.goto("/admin/marca");
  const logo = page.getByRole("img", { name: "Logo actual" });
  await expect(logo.locator("xpath=..")).toHaveCSS("background-color", "rgb(246, 242, 233)");
});

test("CA-1: la bienvenida se ve en el inicio, y vacía no se muestra", async ({ page, context }) => {
  await entrarComo(context, "encargado");
  await page.goto("/admin");
  await page.getByRole("navigation", { name: "Panel" }).getByRole("link", { name: "Ajustes" }).click();
  await page.getByRole("link", { name: /^Marca/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Marca" })).toBeVisible();

  const texto = `Bienvenidos a nuestra cava ${prefijo}`;
  const campo = page.getByLabel("Bienvenida", { exact: true });
  await campo.fill(texto);
  await expect(page.getByText(`${texto.length} de 200 caracteres`)).toBeVisible();
  await page.getByRole("button", { name: "Guardar bienvenida" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Bienvenida guardada" })).toBeVisible();
  await page.goto("/");
  await expect(page.getByText(texto)).toBeVisible();

  await page.goto("/admin/marca");
  await page.getByLabel("Bienvenida", { exact: true }).fill("");
  await page.getByRole("button", { name: "Guardar bienvenida" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Bienvenida guardada" })).toBeVisible();
  await page.goto("/");
  await expect(page.getByText(texto)).toHaveCount(0);
});

test("CA-2: sube un logo con vista previa, la carta lo muestra y se puede volver al original", async ({ page, context }) => {
  await entrarComo(context, "encargado");
  await page.goto("/admin/marca");
  const elegir = page.getByLabel("Logo nuevo", { exact: true });

  await elegir.setInputFiles({ name: "logo.jpg", mimeType: "image/jpeg", buffer: png });
  await expect(page.getByRole("alert").filter({ hasText: "PNG o WebP" })).toBeVisible();

  await elegir.setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: png });
  await expect(page.getByRole("img", { name: "Así se va a ver en la carta" })).toBeVisible();
  await page.getByRole("button", { name: "Usar este logo" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Logo cambiado" })).toBeVisible();
  const ruta = (await admin.from("marca").select("logo_path").eq("id", 1).single()).data!.logo_path!;
  expect(ruta).toMatch(/^logos\/.+\.png$/);

  await page.goto("/seccion/5eed0000-0000-4000-8000-000000000101");
  await expect(logoDeLaCarta(page)).toHaveAttribute("src", new RegExp(ruta.replace(/[/.]/g, "\\$&")));

  // Spec 017, CA-2: el menú del panel (en la computadora) usa el mismo logo.
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/admin");
  await expect(page.getByRole("navigation", { name: "Panel" }).getByRole("img", { name: "Lehonor Enoboutique" })).toHaveAttribute(
    "src",
    new RegExp(ruta.replace(/[/.]/g, "\\$&")),
  );
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/admin/marca");
  await page.getByRole("button", { name: "Volver al logo de la marca" }).click();
  await expect(page.getByRole("status").filter({ hasText: "logo de la marca" })).toBeVisible();
  expect((await admin.from("marca").select("logo_path").eq("id", 1).single()).data!.logo_path).toBeNull();
  // El archivo subido se borró.
  expect((await admin.storage.from("marca").list("logos")).data!.map((o) => `logos/${o.name}`)).not.toContain(ruta);
  await page.goto("/");
  await expect(logoDeLaCarta(page)).toHaveAttribute("src", /logo-enoboutique/);
});
