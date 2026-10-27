import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { camaraSimulada } from "./video-codigo";

// CA-8 (spec 003): el escáner es accesible. La cámara muestra una imagen sin código.
test.use(camaraSimulada("sin-codigo"));

async function erroresGraves(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id);
}

test("CA-8: escaneando: sin errores graves y el estado se anuncia", async ({ page }) => {
  await page.goto("/escanear");
  const estado = page.getByRole("status");
  await expect(estado).toHaveText("Buscando un código de barras…");
  await expect(estado).toHaveAttribute("aria-live", "polite");
  await expect(page.getByRole("button", { name: "Cerrar" })).toBeVisible();
  expect(await erroresGraves(page)).toEqual([]);
});

test("CA-8: sin permiso de cámara: sin errores graves", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("simulado", "NotAllowedError"));
  });
  await page.goto("/escanear");
  await expect(page.getByRole("status")).toHaveText(/permiso/);
  expect(await erroresGraves(page)).toEqual([]);
});

test("CA-8: al encontrar el producto se anuncia su nombre", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as Record<string, unknown>).BarcodeDetector = class {
      static async getSupportedFormats() {
        return ["ean_13", "ean_8", "upc_a", "upc_e"];
      }
      async detect() {
        return [{ rawValue: "7798074860141", format: "ean_13" }];
      }
    };
  });
  const anuncios: string[] = [];
  await page.exposeFunction("registrarAnuncio", (texto: string) => anuncios.push(texto));
  await page.addInitScript(() => {
    new MutationObserver(() => {
      const estado = document.querySelector('[role="status"][aria-live]');
      if (estado?.textContent) (window as unknown as { registrarAnuncio(t: string): void }).registrarAnuncio(estado.textContent);
    }).observe(document, { subtree: true, childList: true, characterData: true });
  });
  await page.goto("/escanear");
  await expect(page).toHaveURL(/\/producto\//, { timeout: 15_000 });
  expect(anuncios).toContain("Encontramos Salentein Primus Malbec.");
});
