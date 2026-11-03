import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { clienteAdmin, limpiarUsuarios } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// Spec 013: promociones. En un solo archivo y en serie porque el panel (CA-6) y el
// carrusel (CA-4 y CA-5) usan la misma tabla: si corrían a la vez en distintos procesos,
// uno borraba o contaba las promociones del otro.
test.describe.configure({ mode: "serial" });

const admin = clienteAdmin();
test.afterAll(limpiarUsuarios);

test.describe("panel (CA-6, en computadora)", () => {
  test.use({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false });
  let previasPanel: string[] = [];
  // PNG de 1×1 de dos colores distintos (para distinguirlas).
  const pngDe = (base64: string) => Buffer.from(base64, "base64");
  const rojo = pngDe("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==");
  const azul = pngDe("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==");

  const nuevas = async () => {
    const { data } = await admin.from("promociones").select("id, imagen_path, visible, orden").order("orden");
    return (data ?? []).filter((p) => !previasPanel.includes(p.id));
  };

  test.beforeAll(async () => {
    previasPanel = ((await admin.from("promociones").select("id")).data ?? []).map((p) => p.id);
  });

  test.afterAll(async () => {
    const creadas = await nuevas();
    await admin.from("promociones").delete().in("id", creadas.map((p) => p.id));
    await admin.storage.from("promociones").remove(creadas.map((p) => p.imagen_path));
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
    await page.getByRole("navigation", { name: "Panel" }).getByRole("link", { name: "Ajustes" }).click();
    await page.getByRole("link", { name: /^Promociones/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Promociones" })).toBeVisible();

    await page.getByLabel("Subir imágenes").setInputFiles([
      { name: "a.png", mimeType: "image/png", buffer: rojo },
      { name: "b.png", mimeType: "image/png", buffer: azul },
    ]);
    await expect(page.getByRole("status").filter({ hasText: "Se sumaron 2 promociones" })).toBeVisible();
    await expect.poll(async () => (await nuevas()).length).toBe(2);
    await expect(lista(page).getByRole("img")).toHaveCount(previasPanel.length + 2);

    await page.getByLabel("Subir imágenes").setInputFiles({ name: "c.pdf", mimeType: "application/pdf", buffer: Buffer.from("x") });
    await expect(page.getByRole("alert").filter({ hasText: "JPG, PNG o WebP" })).toBeVisible();
  });

  test("CA-6: las ordena, oculta y borra (con confirmación)", async ({ page, context }) => {
    await entrarComo(context, "encargado");
    await page.goto("/admin/promociones");
    const [primera, segunda] = await nuevas();
    const total = previasPanel.length + 2;

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
});

test.describe("carrusel del inicio (CA-4 y CA-5)", () => {
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
});
