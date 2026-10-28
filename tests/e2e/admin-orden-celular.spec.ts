import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { clienteAdmin, limpiarDatos, limpiarUsuarios, prefijo } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// Spec 005, CA-4: las listas que se arrastran, en el celular y con lector de pantalla.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
test.describe.configure({ mode: "serial" });

const admin = clienteAdmin();
const seccion = `${prefijo} Celular`;
const nombre = (n: string) => `${prefijo} ${n}`;
let seccionId = "";

test.beforeAll(async () => {
  seccionId = (await admin.from("secciones").insert({ nombre: seccion, orden: 30000 }).select().single()).data!.id;
  for (const [i, n] of ["Primero", "Segundo", "Tercero"].entries()) {
    await admin.from("productos").insert({ tipo: "vino", nombre: nombre(n), seccion_id: seccionId, orden: i + 1 });
  }
});

test.afterAll(async () => {
  await limpiarDatos();
  await limpiarUsuarios();
});

test.beforeEach(async ({ context }) => {
  await entrarComo(context, "vendedor");
});

const destacados = (page: Page) => page.getByRole("list", { name: "Destacados" }).getByRole("heading").allTextContents();

test("CA-4: destacados en el celular: sin errores graves, sin scroll horizontal y con manijas de 44 px", async ({ page }) => {
  await page.goto(`/admin/secciones/${seccionId}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - 390)).toBeLessThanOrEqual(0);
  // 3 manijas, 3 "Quitar" y "Buscar".
  const botones = await page.getByRole("main").getByRole("button").all();
  expect(botones).toHaveLength(7);
  for (const boton of botones) {
    const caja = (await boton.boundingBox())!;
    expect(Math.min(caja.width, caja.height), await boton.getAttribute("aria-label") ?? "").toBeGreaterThanOrEqual(44);
  }
});

test("CA-4: solo la manija toma el dedo; el resto de la fila deja scrollear", async ({ page }) => {
  await page.goto(`/admin/secciones/${seccionId}`);
  const manija = page.getByRole("button", { name: `Mover ${nombre("Primero")}` });
  await expect(manija).toHaveCSS("touch-action", "none");
  await expect(page.getByRole("list", { name: "Destacados" }).getByRole("listitem").first()).not.toHaveCSS("touch-action", "none");
  // La manija explica cómo usarla con el teclado y el lector de pantalla.
  const instrucciones = await manija.getAttribute("aria-describedby");
  await expect(page.locator(`[id="${instrucciones}"]`)).toHaveText(
    "Para mover, apretá Espacio, usá las flechas arriba y abajo, y apretá Espacio para soltar. Escape cancela.",
  );
});

test("CA-4: en el celular se arrastra desde la manija", async ({ page }) => {
  await page.goto(`/admin/secciones/${seccionId}`);
  const origen = (await page.getByRole("button", { name: `Mover ${nombre("Tercero")}` }).boundingBox())!;
  const destino = (await page.getByRole("button", { name: `Mover ${nombre("Primero")}` }).boundingBox())!;
  await page.mouse.move(origen.x + origen.width / 2, origen.y + origen.height / 2);
  await page.mouse.down();
  await page.mouse.move(destino.x + destino.width / 2, destino.y - 10, { steps: 12 });
  await page.mouse.up();
  await expect(page.getByRole("status").filter({ hasText: "Orden guardado" })).toBeVisible();
  expect(await destacados(page)).toEqual([nombre("Tercero"), nombre("Primero"), nombre("Segundo")]);
});
