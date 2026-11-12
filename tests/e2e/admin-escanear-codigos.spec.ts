import { expect, test, type Page } from "@playwright/test";
import { clienteAdmin, limpiarDatos, limpiarUsuarios, prefijo } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";
import { camaraSimulada } from "./video-codigo";
import { desborde, erroresGraves, tocablesChicos } from "./chequeos-celular";

// Spec 019: escanear códigos de barras desde el panel, con la cámara del celular.
// Cámara simulada (Chromium) y lector simulado: devuelve el código que diga el test.
test.use(camaraSimulada("sin-codigo"));

const admin = clienteAdmin();
const ids: Record<string, string> = {};
// EAN-13 válidos (dígito verificador correcto) propios de esta corrida.
function ean13(base12: string) {
  const suma = [...base12].reverse().reduce((t, d, i) => t + Number(d) * (i % 2 === 0 ? 3 : 1), 0);
  return base12 + ((10 - (suma % 10)) % 10);
}
const base = String(Date.now()).slice(-8);
const codigos = { nuevo: ean13(`2991${base}`), ajeno: ean13(`2992${base}`), propio: ean13(`2993${base}`) };

test.beforeAll(async () => {
  ids.vino = (await admin.from("productos").insert({ tipo: "vino", nombre: `Catena Alta Malbec ${prefijo}` }).select().single()).data!.id;
  ids.otro = (await admin.from("productos").insert({ tipo: "vino", nombre: `Angélica Zapata Malbec ${prefijo}` }).select().single()).data!.id;
  await admin.from("codigos_barras").insert([
    { codigo: codigos.ajeno, producto_id: ids.otro },
    { codigo: codigos.propio, producto_id: ids.vino },
  ]);
});

test.afterAll(async () => {
  await limpiarDatos();
  await limpiarUsuarios();
});

/** El lector simulado lee `window.__codigo` (cuando no es null). */
async function lectorSimulado(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__codigo = null;
    w.__vibraciones = 0;
    navigator.vibrate = (() => ((w.__vibraciones as number)++, true)) as Navigator["vibrate"];
    w.BarcodeDetector = class {
      static async getSupportedFormats() {
        return ["ean_13", "ean_8", "upc_a", "upc_e"];
      }
      async detect() {
        return w.__codigo ? [{ rawValue: w.__codigo, format: "ean_13" }] : [];
      }
    };
  });
}
const leer = (page: Page, codigo: string) => page.evaluate((c) => ((window as unknown as Record<string, unknown>).__codigo = c), codigo);
const codigosEnBase = async (productoId: string) =>
  ((await admin.from("codigos_barras").select("codigo").eq("producto_id", productoId)).data ?? []).map((c) => c.codigo).sort();

test.beforeEach(async ({ page, context }) => {
  await entrarComo(context, "vendedor");
  await lectorSimulado(page);
});

test("CA-1: escanea en la ficha y el código se agrega; después, Escanear otro", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.vino}?pestana=codigos`);
  await page.getByRole("button", { name: "Escanear con la cámara" }).click();
  const dialogo = page.getByRole("dialog", { name: "Escanear código de barras" });
  await expect(dialogo.locator("video")).toBeVisible();
  await expect(dialogo.getByRole("status")).toHaveText("Buscando un código de barras…");
  expect(await erroresGraves(page)).toEqual([]);

  // Una lectura a medias (dígito verificador mal) se ignora.
  await leer(page, codigos.nuevo.slice(0, 12) + ((Number(codigos.nuevo[12]) + 1) % 10));
  await page.waitForTimeout(500);
  await expect(dialogo).toBeVisible();

  await leer(page, codigos.nuevo);
  await expect(dialogo).toBeHidden();
  await expect(page.getByRole("status").filter({ hasText: "Se agregó el código" })).toHaveText(`Se agregó el código ${codigos.nuevo}.`);
  await expect(page.getByRole("list", { name: "Códigos de barras" })).toContainText(codigos.nuevo);
  expect(await codigosEnBase(ids.vino)).toEqual([codigos.nuevo, codigos.propio].sort());
  expect(await page.evaluate(() => (window as unknown as { __vibraciones: number }).__vibraciones)).toBe(1);
  // La cámara quedó apagada.
  expect(await page.evaluate(() => [...document.querySelectorAll("video")].some((v) => (v.srcObject as MediaStream | null)?.active))).toBe(false);

  await leer(page, "");
  await page.getByRole("button", { name: "Escanear otro" }).click();
  await expect(page.getByRole("dialog", { name: "Escanear código de barras" }).locator("video")).toBeVisible();
});

test("CA-1: si el código es de otro producto, avisa de cuál y no lo agrega", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.vino}?pestana=codigos`);
  await page.getByRole("button", { name: "Escanear con la cámara" }).click();
  await leer(page, codigos.ajeno);
  await expect(page.getByRole("alert").filter({ hasText: "ya es de" })).toHaveText(`El código ${codigos.ajeno} ya es de Angélica Zapata Malbec ${prefijo}.`);
  expect(await codigosEnBase(ids.otro)).toEqual([codigos.ajeno]);
});

test("CA-1: si ya era de este producto, avisa que ya estaba", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.vino}?pestana=codigos`);
  await page.getByRole("button", { name: "Escanear con la cámara" }).click();
  await leer(page, codigos.propio);
  await expect(page.getByRole("status").filter({ hasText: "ya estaba" })).toHaveText(`El código ${codigos.propio} ya estaba cargado en este producto.`);
});

test("CA-3: sin permiso de cámara, explica cómo habilitarlo y se puede escribir a mano; Cerrar apaga todo", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("simulado", "NotAllowedError"));
  });
  await page.goto(`/admin/productos/${ids.vino}?pestana=codigos`);
  await page.getByRole("button", { name: "Escanear con la cámara" }).click();
  const dialogo = page.getByRole("dialog", { name: "Escanear código de barras" });
  await expect(dialogo.getByRole("status")).toHaveText(/No tenemos permiso para usar la cámara/);
  await dialogo.getByRole("button", { name: "Cerrar" }).click();
  await expect(dialogo).toBeHidden();
  await expect(page.getByLabel("Código de barras", { exact: true })).toBeVisible();
});

test.describe("CA-2: desde la lista de productos", () => {
  test("un código cargado abre la ficha del producto, en Códigos de barras", async ({ page }) => {
    await page.goto("/admin");
    await page.getByRole("button", { name: "Escanear un código de barras" }).click();
    await leer(page, codigos.ajeno);
    await expect(page).toHaveURL(new RegExp(`/admin/productos/${ids.otro}\\?pestana=codigos`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Angélica Zapata Malbec ${prefijo}`);
  });

  test("un código nuevo: avisa, se busca el producto por nombre y en su ficha se agrega con un toque", async ({ page }) => {
    const nuevo = ean13(`2994${base}`);
    await page.goto("/admin");
    await page.getByRole("button", { name: "Escanear un código de barras" }).click();
    await leer(page, nuevo);
    await expect(page.getByRole("status").filter({ hasText: "Ningún producto" })).toContainText(`Ningún producto tiene el código ${nuevo}.`);
    await page.getByRole("searchbox", { name: "Buscar productos" }).fill(`Catena Alta Malbec ${prefijo}`);
    await page.getByRole("link", { name: new RegExp(`^Catena Alta Malbec ${prefijo}`) }).click();
    await expect(page).toHaveURL(/pestana=codigos/);
    await page.getByRole("button", { name: `Agregar ${nuevo}` }).click();
    await expect(page.getByRole("status").filter({ hasText: "Se agregó" })).toHaveText(`Se agregó el código ${nuevo}.`);
    expect(await codigosEnBase(ids.vino)).toContain(nuevo);
  });

  test("CA-4: en el celular (390 px), sin errores graves, sin scroll horizontal y con botones de 44 px", async ({ page }) => {
    await page.goto("/admin");
    expect(await tocablesChicos(page)).toEqual([]);
    await page.getByRole("button", { name: "Escanear un código de barras" }).click();
    const dialogo = page.getByRole("dialog", { name: "Escanear código de barras" });
    await expect(dialogo.locator("video")).toBeVisible();
    expect(await erroresGraves(page)).toEqual([]);
    expect(await desborde(page)).toBeLessThanOrEqual(0);
    await dialogo.getByRole("button", { name: "Cerrar" }).click();

    await page.goto(`/admin/productos/${ids.vino}?pestana=codigos`);
    expect(await desborde(page)).toBeLessThanOrEqual(0);
    expect(await tocablesChicos(page)).toEqual([]);
    expect(await erroresGraves(page)).toEqual([]);
  });
});
