import { expect, test, type Page } from "@playwright/test";
import { camaraSimulada } from "./video-codigo";

// CA-9 y CA-10 (spec 003). La cámara simulada de Chromium no tiene linterna: se simula
// una que la informa, registrando los pedidos que le hace la carta.
test.use(camaraSimulada("sin-codigo"));

async function camaraConLinterna(page: Page, tieneLinterna: boolean) {
  await page.addInitScript((linterna) => {
    const w = window as unknown as { __pedidosCamara: unknown[]; __restricciones: unknown[] };
    w.__pedidosCamara = [];
    w.__restricciones = [];
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (opciones) => {
      w.__pedidosCamara.push(opciones);
      const flujo = await original(opciones);
      const pista = flujo.getVideoTracks()[0];
      pista.getCapabilities = () =>
        (linterna ? { torch: true, focusMode: ["manual", "continuous"] } : { focusMode: ["continuous"] }) as unknown as MediaTrackCapabilities;
      pista.applyConstraints = async (r) => {
        w.__restricciones.push(r);
      };
      return flujo;
    };
  }, tieneLinterna);
}
const restricciones = (page: Page) => page.evaluate(() => (window as unknown as { __restricciones: unknown[] }).__restricciones);

test("CA-9: prende y apaga la linterna", async ({ page }) => {
  await camaraConLinterna(page, true);
  await page.goto("/escanear");
  const boton = page.getByRole("button", { name: "Prender linterna" });
  await expect(boton).toBeVisible();
  await expect(boton).toHaveAttribute("aria-pressed", "false");

  await boton.click();
  const apagar = page.getByRole("button", { name: "Apagar linterna" });
  await expect(apagar).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => restricciones(page)).toContainEqual({ advanced: [{ torch: true }] });

  await apagar.click();
  await expect(page.getByRole("button", { name: "Prender linterna" })).toBeVisible();
  await expect.poll(() => restricciones(page)).toContainEqual({ advanced: [{ torch: false }] });
});

test("CA-9: sin linterna (por ejemplo, iPhone) el botón no aparece", async ({ page }) => {
  await camaraConLinterna(page, false);
  await page.goto("/escanear");
  await expect(page.getByRole("status")).toHaveText("Buscando un código de barras…");
  await expect(page.getByRole("button", { name: /linterna/ })).toHaveCount(0);
});

test("CA-10: pide la cámara trasera en alta resolución y enfoque continuo", async ({ page }) => {
  await camaraConLinterna(page, true);
  await page.goto("/escanear");
  await expect(page.getByRole("status")).toHaveText("Buscando un código de barras…");
  const pedidos = await page.evaluate(() => (window as unknown as { __pedidosCamara: MediaStreamConstraints[] }).__pedidosCamara);
  expect(pedidos.at(-1)).toMatchObject({
    audio: false,
    video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
  });
  await expect.poll(() => restricciones(page)).toContainEqual({ advanced: [{ focusMode: "continuous" }] });
});
