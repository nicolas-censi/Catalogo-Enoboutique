import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { clienteAdmin, limpiarUsuarios } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// Spec 013, CA-4 y CA-5: carrusel de promociones del inicio. Se cargan 3 desde el panel
// (así la carta las muestra al instante) y se borran al final.
test.describe.configure({ mode: "serial" });

const admin = clienteAdmin();
let previas: string[] = [];
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

test.beforeAll(async ({ browser }) => {
  previas = ((await admin.from("promociones").select("id")).data ?? []).map((p) => p.id);
  // Este test supone que no hay otras promociones visibles: las que hubiera se ocultan un rato.
  const contexto = await browser.newContext({ baseURL: "http://localhost:3100" });
  await entrarComo(contexto, "encargado");
  const pagina = await contexto.newPage();
  await pagina.goto("/admin/promociones");
  await pagina.getByLabel("Subir imágenes").setInputFiles([1, 2, 3].map((n) => ({ name: `p${n}.png`, mimeType: "image/png", buffer: png })));
  await expect(pagina.getByRole("status").filter({ hasText: "Se sumaron 3 promociones" })).toBeVisible();
  await contexto.close();
});

test.afterAll(async () => {
  const { data } = await admin.from("promociones").select("id, imagen_path");
  const creadas = (data ?? []).filter((p) => !previas.includes(p.id));
  await admin.from("promociones").delete().in("id", creadas.map((p) => p.id));
  await admin.storage.from("promociones").remove(creadas.map((p) => p.imagen_path));
  await limpiarUsuarios();
});

const carrusel = (page: Page) => page.getByRole("region", { name: "Promociones" });
const posicion = (page: Page) => carrusel(page).getByRole("list").evaluate((el) => Math.round(el.scrollLeft / el.clientWidth));

test("CA-4: el carrusel está al final del inicio y pasa solo cada 5 segundos", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  await expect(carrusel(page).getByRole("button", { name: /^Ver en grande la promoción \d de \d$/ })).toHaveCount(previas.length + 3);
  expect(await posicion(page)).toBe(0);
  // Que la página termine de cargar su código (el temporizador se arma en el navegador).
  await page.waitForLoadState("networkidle");
  await page.clock.fastForward(5100);
  await expect.poll(() => posicion(page)).toBe(1);
});

test("CA-4: se puede pausar", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await carrusel(page).getByRole("button", { name: "Pausar las promociones" }).click();
  await page.clock.fastForward(12_000);
  expect(await posicion(page)).toBe(0);
  await expect(carrusel(page).getByRole("button", { name: "Reanudar las promociones" })).toHaveAttribute("aria-pressed", "true");
});

test("CA-5: tocar una promoción la muestra en grande; se cierra con Cerrar, Escape o Atrás", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const total = previas.length + 3;
  const abrir = () => carrusel(page).getByRole("button", { name: `Ver en grande la promoción 1 de ${total}` }).click();
  const ampliada = page.getByRole("dialog", { name: `Promoción 1 de ${total}` });

  await abrir();
  await expect(ampliada).toBeVisible();
  await expect(ampliada.getByRole("img", { name: `Promoción 1 de ${total}` })).toBeVisible();
  await ampliada.getByRole("button", { name: "Cerrar" }).click();
  await expect(ampliada).toBeHidden();

  await abrir();
  await page.keyboard.press("Escape");
  await expect(ampliada).toBeHidden();

  await abrir();
  await page.goBack();
  await expect(ampliada).toBeHidden();
  await expect(page).toHaveURL(/\/$/);
  await expect(carrusel(page)).toBeVisible();
});

test("CA-4 y CA-5: sin errores graves de accesibilidad, en el carrusel y en grande", async ({ page }) => {
  const graves = async () =>
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => v.id);
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(await graves()).toEqual([]);
  await carrusel(page).getByRole("button", { name: /^Ver en grande la promoción 1 / }).click();
  expect(await graves()).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
});

test.describe("con reducir movimiento", () => {
  test.use({ reducedMotion: "reduce" });
  test("CA-4: no pasa solo", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    await expect(carrusel(page)).toBeVisible();
    await page.waitForLoadState("networkidle");
    await page.clock.fastForward(12_000);
    expect(await posicion(page)).toBe(0);
  });
});
