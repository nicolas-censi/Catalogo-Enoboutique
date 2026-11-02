import { expect, test, type Page } from "@playwright/test";
import { clienteAdmin, limpiarUsuarios } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// Spec 013, CA-6: promociones desde el panel (computadora). Las promociones que ya había
// en la base no se tocan; las que crea el test se borran al final.
test.use({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false });
test.describe.configure({ mode: "serial" });

const admin = clienteAdmin();
let previas: string[] = [];
// PNG de 1×1 de dos colores distintos (para distinguirlas).
const png = (base64: string) => Buffer.from(base64, "base64");
const rojo = png("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==");
const azul = png("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==");

const nuevas = async () => {
  const { data } = await admin.from("promociones").select("id, imagen_path, visible, orden").order("orden");
  return (data ?? []).filter((p) => !previas.includes(p.id));
};

test.beforeAll(async () => {
  previas = ((await admin.from("promociones").select("id")).data ?? []).map((p) => p.id);
});

test.afterAll(async () => {
  const creadas = await nuevas();
  await admin.from("promociones").delete().in("id", creadas.map((p) => p.id));
  await admin.storage.from("promociones").remove(creadas.map((p) => p.imagen_path));
  await limpiarUsuarios();
});

const lista = (page: Page) => page.getByRole("list", { name: "Promociones" });

test("CA-6: un vendedor no tiene acceso a Promociones", async ({ page, context }) => {
  await entrarComo(context, "vendedor");
  await page.goto("/admin/promociones");
  await expect(page.getByText("No tenés acceso al panel.")).toBeVisible();
});

test("CA-6: sube imágenes, quedan al final y se ven en la lista", async ({ page, context }) => {
  await entrarComo(context, "encargado");
  await page.goto("/admin");
  await page.getByRole("navigation", { name: "Panel" }).getByRole("link", { name: "Promociones" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Promociones" })).toBeVisible();

  await page.getByLabel("Subir imágenes").setInputFiles([
    { name: "a.png", mimeType: "image/png", buffer: rojo },
    { name: "b.png", mimeType: "image/png", buffer: azul },
  ]);
  await expect(page.getByRole("status").filter({ hasText: "Se sumaron 2 promociones" })).toBeVisible();
  await expect.poll(async () => (await nuevas()).length).toBe(2);
  await expect(lista(page).getByRole("img")).toHaveCount(previas.length + 2);

  await page.getByLabel("Subir imágenes").setInputFiles({ name: "c.pdf", mimeType: "application/pdf", buffer: Buffer.from("x") });
  await expect(page.getByRole("alert").filter({ hasText: "JPG, PNG o WebP" })).toBeVisible();
});

test("CA-6: las ordena, oculta y borra (con confirmación)", async ({ page, context }) => {
  await entrarComo(context, "encargado");
  await page.goto("/admin/promociones");
  const [primera, segunda] = await nuevas();
  const total = previas.length + 2;

  // La última sube un lugar con el teclado.
  const manija = page.getByRole("button", { name: `Mover Promoción ${total}` });
  await manija.focus();
  await page.keyboard.press("Space");
  await expect(manija).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(150); // dnd-kit escucha las flechas desde el próximo ciclo
  await page.keyboard.press("ArrowUp");
  await expect(page.getByText(`Promoción ${total}, posición ${total - 1} de ${total}.`, { exact: true })).toBeAttached();
  await page.keyboard.press("Space");
  await expect(page.getByRole("status").filter({ hasText: "Orden guardado" })).toBeVisible();
  await expect.poll(async () => (await nuevas()).map((p) => p.id)).toEqual([segunda.id, primera.id]);

  const fila = (n: number) => lista(page).getByRole("listitem").nth(n - 1);
  await fila(total).getByRole("switch", { name: `En la carta: Promoción ${total}` }).click();
  await expect.poll(async () => (await nuevas()).find((p) => p.id === primera.id)!.visible).toBe(false);

  await fila(total).getByRole("button", { name: `Borrar Promoción ${total}` }).click();
  await fila(total).getByRole("button", { name: "Sí, borrar" }).click();
  await expect.poll(async () => (await nuevas()).map((p) => p.id)).toEqual([segunda.id]);
});
