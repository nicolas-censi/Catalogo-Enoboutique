import { expect, test, type Page } from "@playwright/test";
import { camaraSimulada } from "./video-codigo";

// CA-9 y CA-10 (spec 003). La cámara simulada de Chromium no tiene linterna: se simulan
// celulares con una o varias cámaras traseras, con o sin flash, y se registra lo que la
// carta les pide.
test.use(camaraSimulada("sin-codigo"));

type Camara = { id: string; etiqueta: string; linterna: boolean };
type Celular = { navegadorSoportaLinterna: boolean; camaras: Camara[] };

async function simularCelular(page: Page, celular: Celular) {
  await page.addInitScript((config: Celular) => {
    type Registro = { aperturas: { id: string; opciones: MediaStreamConstraints }[]; restricciones: { id: string; r: unknown }[] };
    const w = window as unknown as { __camara: Registro };
    w.__camara = { aperturas: [], restricciones: [] };
    const md = navigator.mediaDevices;
    const original = md.getUserMedia.bind(md);
    const soportadas = md.getSupportedConstraints.bind(md);
    md.getSupportedConstraints = () => {
      const s = { ...soportadas() } as Record<string, boolean>;
      if (config.navegadorSoportaLinterna) s.torch = true;
      else delete s.torch;
      return s as MediaTrackSupportedConstraints;
    };
    md.enumerateDevices = async () =>
      config.camaras.map((c) => ({ kind: "videoinput", deviceId: c.id, label: c.etiqueta, groupId: "" }) as MediaDeviceInfo);
    md.getUserMedia = async (opciones) => {
      const pedido = (opciones?.video ?? {}) as MediaTrackConstraints;
      const exacto = (pedido.deviceId as ConstrainDOMStringParameters | undefined)?.exact as string | undefined;
      const camara = config.camaras.find((c) => c.id === exacto) ?? config.camaras[0];
      w.__camara.aperturas.push({ id: camara.id, opciones: opciones! });
      const flujo = await original({ video: true, audio: false });
      const pista = flujo.getVideoTracks()[0];
      const ajustes = pista.getSettings.bind(pista);
      pista.getSettings = () => ({ ...ajustes(), deviceId: camara.id });
      pista.getCapabilities = () =>
        ({ focusMode: ["continuous"], ...(camara.linterna ? { torch: true } : {}) }) as unknown as MediaTrackCapabilities;
      pista.applyConstraints = async (r) => {
        w.__camara.restricciones.push({ id: camara.id, r });
        const pedidoLinterna = (r?.advanced?.[0] as { torch?: boolean } | undefined)?.torch;
        if (pedidoLinterna !== undefined && !camara.linterna) throw new DOMException("sin linterna", "NotSupportedError");
      };
      return flujo;
    };
  }, celular);
}

const registro = (page: Page) =>
  page.evaluate(() => (window as unknown as { __camara: { aperturas: { id: string; opciones: MediaStreamConstraints }[]; restricciones: { id: string; r: unknown }[] } }).__camara);
const linterna = (prender: boolean) => ({ advanced: [{ torch: prender }] });

test("CA-9: prende y apaga la linterna de la cámara abierta", async ({ page }) => {
  await simularCelular(page, { navegadorSoportaLinterna: true, camaras: [{ id: "principal", etiqueta: "camera2 0, facing back", linterna: true }] });
  await page.goto("/escanear");
  const boton = page.getByRole("button", { name: "Prender linterna" });
  await expect(boton).toHaveAttribute("aria-pressed", "false");

  await boton.click();
  const apagar = page.getByRole("button", { name: "Apagar linterna" });
  await expect(apagar).toHaveAttribute("aria-pressed", "true");
  await expect.poll(async () => (await registro(page)).restricciones).toContainEqual({ id: "principal", r: linterna(true) });

  await apagar.click();
  await expect(page.getByRole("button", { name: "Prender linterna" })).toBeVisible();
  await expect.poll(async () => (await registro(page)).restricciones).toContainEqual({ id: "principal", r: linterna(false) });
});

test("CA-9: si Chrome abrió una cámara sin flash, cambia a la trasera que lo tiene y sigue escaneando", async ({ page }) => {
  await simularCelular(page, {
    navegadorSoportaLinterna: true,
    camaras: [
      { id: "gran-angular", etiqueta: "camera2 2, facing back", linterna: false },
      { id: "frontal", etiqueta: "camera2 1, facing front", linterna: false },
      { id: "principal", etiqueta: "camera2 0, facing back", linterna: true },
    ],
  });
  await page.goto("/escanear");
  await expect(page.getByRole("status")).toHaveText("Buscando un código de barras…");
  await page.getByRole("button", { name: "Prender linterna" }).click();

  await expect(page.getByRole("button", { name: "Apagar linterna" })).toBeVisible();
  const { aperturas, restricciones } = await registro(page);
  expect(aperturas.map((a) => a.id)).toContain("principal");
  expect(restricciones).toContainEqual({ id: "principal", r: linterna(true) });
  await expect(page.getByRole("status")).toHaveText("Buscando un código de barras…");
  await expect(page.locator("video")).toBeVisible();
});

test("CA-9: si ninguna cámara tiene flash, saca el botón y avisa", async ({ page }) => {
  await simularCelular(page, {
    navegadorSoportaLinterna: true,
    camaras: [
      { id: "trasera", etiqueta: "camera2 0, facing back", linterna: false },
      { id: "frontal", etiqueta: "camera2 1, facing front", linterna: false },
    ],
  });
  await page.goto("/escanear");
  await page.getByRole("button", { name: "Prender linterna" }).click();
  await expect(page.getByText("Este celular no permite prender la linterna desde el navegador.")).toBeVisible();
  await expect(page.getByRole("button", { name: /linterna/ })).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("Buscando un código de barras…");
});

test("CA-9: en un navegador sin linterna (Safari en iPhone) el botón no aparece", async ({ page }) => {
  await simularCelular(page, { navegadorSoportaLinterna: false, camaras: [{ id: "trasera", etiqueta: "Cámara trasera", linterna: false }] });
  await page.goto("/escanear");
  await expect(page.getByRole("status")).toHaveText("Buscando un código de barras…");
  await expect(page.getByRole("button", { name: /linterna/ })).toHaveCount(0);
});

test("CA-10: pide la cámara trasera en alta resolución y enfoque continuo", async ({ page }) => {
  await simularCelular(page, { navegadorSoportaLinterna: true, camaras: [{ id: "principal", etiqueta: "camera2 0, facing back", linterna: true }] });
  await page.goto("/escanear");
  await expect(page.getByRole("status")).toHaveText("Buscando un código de barras…");
  const { aperturas } = await registro(page);
  expect(aperturas.at(-1)!.opciones).toMatchObject({
    audio: false,
    video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
  });
  await expect.poll(async () => (await registro(page)).restricciones).toContainEqual({
    id: "principal",
    r: { advanced: [{ focusMode: "continuous" }] },
  });
});
