import { expect, test } from "@playwright/test";
import { camaraSimulada } from "./video-codigo";

// CA-5 (spec 003): cerrar o salir apaga la cámara. La cámara muestra una imagen sin
// código, así el escáner queda buscando hasta que se cierra.
test.use(camaraSimulada("sin-codigo"));

/** Registra las pistas de video que abre la página, para ver si se apagan. */
async function registrarPistas(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __pistas: MediaStreamTrack[] };
    w.__pistas = [];
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (opciones) => {
      const flujo = await original(opciones);
      w.__pistas.push(...flujo.getTracks());
      return flujo;
    };
  });
}
const estadosPistas = (page: import("@playwright/test").Page) =>
  page.evaluate(() => (window as unknown as { __pistas: MediaStreamTrack[] }).__pistas.map((p) => p.readyState));
// En desarrollo React monta el escáner dos veces (la primera pista se apaga enseguida):
// importa que haya una cámara encendida mientras escanea y ninguna al salir.
const algunaEncendida = async (page: import("@playwright/test").Page) => (await estadosPistas(page)).includes("live");
const todasApagadas = async (page: import("@playwright/test").Page) => {
  const estados = await estadosPistas(page);
  return estados.length > 0 && estados.every((e) => e === "ended");
};

test("CA-5: Cerrar apaga la cámara y vuelve a la carta", async ({ page }) => {
  await registrarPistas(page);
  await page.goto("/");
  await page.getByRole("link", { name: "Escanear código" }).click();
  await expect(page.getByRole("status")).toHaveText("Buscando un código de barras…");
  expect(await algunaEncendida(page)).toBe(true);

  await page.getByRole("button", { name: "Cerrar" }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(await todasApagadas(page)).toBe(true);
});

test("CA-5: volver atrás también apaga la cámara", async ({ page }) => {
  await registrarPistas(page);
  await page.goto("/");
  await page.getByRole("link", { name: "Escanear código" }).click();
  await expect(page.getByRole("status")).toHaveText("Buscando un código de barras…");
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => todasApagadas(page)).toBe(true);
});

