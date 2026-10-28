import { expect, test, type Page } from "@playwright/test";
import { camaraSimulada } from "./video-codigo";

// CA-9 (spec 003): la cámara se pide para que el código se lea fácil, sin botones extra.
// Se registra lo que la carta le pide a la cámara.
test.use(camaraSimulada("sin-codigo"));

async function registrarCamara(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __camara: { opciones: unknown[]; restricciones: unknown[] } };
    w.__camara = { opciones: [], restricciones: [] };
    const md = navigator.mediaDevices;
    const original = md.getUserMedia.bind(md);
    md.getUserMedia = async (opciones) => {
      w.__camara.opciones.push(opciones);
      const flujo = await original({ video: true, audio: false });
      const pista = flujo.getVideoTracks()[0];
      pista.getCapabilities = () => ({ focusMode: ["continuous"], torch: true }) as unknown as MediaTrackCapabilities;
      pista.applyConstraints = async (r) => void w.__camara.restricciones.push(r);
      return flujo;
    };
  });
}

const registro = (page: Page) =>
  page.evaluate(() => (window as unknown as { __camara: { opciones: unknown[]; restricciones: unknown[] } }).__camara);

test("CA-9: pide la cámara trasera en alta resolución y con enfoque continuo", async ({ page }) => {
  await registrarCamara(page);
  await page.goto("/escanear");
  await expect(page.getByRole("status")).toHaveText("Buscando un código de barras…");
  expect((await registro(page)).opciones.at(-1)).toMatchObject({
    audio: false,
    video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
  });
  await expect.poll(async () => (await registro(page)).restricciones).toContainEqual({ advanced: [{ focusMode: "continuous" }] });
});

test("CA-9: solo el lector con la cámara: sin linterna y con una indicación para encuadrar", async ({ page }) => {
  await registrarCamara(page);
  await page.goto("/escanear");
  await expect(page.getByRole("status")).toHaveText("Buscando un código de barras…");
  await expect(page.getByText("Poné el código dentro del recuadro. Si se ve borroso, alejá un poco el celular.")).toBeVisible();
  await expect(page.getByRole("button", { name: /linterna/i })).toHaveCount(0);
  const pidioLinterna = (await registro(page)).restricciones.some((r) => JSON.stringify(r).includes("torch"));
  expect(pidioLinterna).toBe(false);
});
