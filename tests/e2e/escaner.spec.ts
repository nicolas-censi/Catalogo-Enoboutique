import { expect, test } from "@playwright/test";
import { camaraSimulada } from "./video-codigo";

// CA-2 (spec 003): escanear lleva al detalle del producto.
// Usa los datos de ejemplo: el código 7798074860141 es de Salentein Primus Malbec.
const SALENTEIN_PRIMUS = "/producto/5eed0000-0000-4000-8000-000000000202";

// La cámara simulada se configura por archivo (Playwright abre un navegador por video).
test.use(camaraSimulada("7798074860141"));

test.describe("con el lector nativo del navegador (Chrome en Android)", () => {
  test("al reconocer el código vibra y lleva al detalle", async ({ page }) => {
    // Este Chromium (Linux) no trae lector nativo: se simula uno que reconoce el código.
    await page.addInitScript(() => {
      const w = window as unknown as Record<string, unknown>;
      w.__vibraciones = [] as number[];
      navigator.vibrate = ((patron: VibratePattern) => ((w.__vibraciones as unknown[]).push(patron), true)) as Navigator["vibrate"];
      let llamadas = 0;
      w.BarcodeDetector = class {
        static async getSupportedFormats() {
          return ["ean_13", "ean_8", "upc_a", "upc_e", "qr_code"];
        }
        async detect() {
          llamadas++;
          // Primero una lectura parcial (dígito verificador inválido), que se ignora.
          if (llamadas === 1) return [{ rawValue: "7798074860142", format: "ean_13" }];
          return [{ rawValue: "7798074860141", format: "ean_13" }];
        }
      };
    });
    await page.goto("/");
    await page.getByRole("link", { name: "Escanear código" }).click();
    await expect(page).toHaveURL(SALENTEIN_PRIMUS, { timeout: 15_000 });
    await expect(page.getByRole("heading", { level: 1, name: "Salentein Primus Malbec" })).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __vibraciones: unknown[] }).__vibraciones.length)).toBe(1);
  });
});

test.describe("con la librería ZXing (iPhone y navegadores sin lector)", () => {
  test("lee el código del video de la cámara y lleva al detalle", async ({ page }) => {
    const pedidosZxing: string[] = [];
    page.on("request", (p) => {
      if (/zxing|jsdelivr|unpkg/.test(p.url())) pedidosZxing.push(p.url());
    });
    await page.goto("/escanear");
    await expect(page.locator("video")).toBeVisible();
    await expect(page).toHaveURL(SALENTEIN_PRIMUS, { timeout: 20_000 });
    // El .wasm sale de nuestro propio sitio, nunca de un CDN.
    expect(pedidosZxing.some((u) => u.includes("/zxing/") && u.endsWith(".wasm"))).toBe(true);
    expect(pedidosZxing.filter((u) => /jsdelivr|unpkg/.test(u))).toEqual([]);
  });
});
