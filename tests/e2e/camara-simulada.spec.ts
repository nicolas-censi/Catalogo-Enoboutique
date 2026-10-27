import { expect, test } from "@playwright/test";
import { camaraSimulada, modulosEan13 } from "./video-codigo";

// T2: la cámara simulada entrega el video con el código de barras.
test.use(camaraSimulada("7798074860141"));

test("el EAN-13 generado tiene 95 módulos y empieza y termina con las guardas", () => {
  const modulos = modulosEan13("7798074860141");
  expect(modulos).toHaveLength(95);
  expect(modulos.startsWith("101")).toBe(true);
  expect(modulos.endsWith("101")).toBe(true);
});

test("la cámara simulada entrega el video con barras", async ({ page }) => {
  await page.goto("/");
  const resultado = await page.evaluate(async () => {
    const flujo = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.createElement("video");
    video.muted = true;
    video.srcObject = flujo;
    await video.play();
    await new Promise((r) => setTimeout(r, 300));
    const lienzo = document.createElement("canvas");
    lienzo.width = video.videoWidth;
    lienzo.height = video.videoHeight;
    const ctx = lienzo.getContext("2d")!;
    ctx.drawImage(video, 0, 0);
    const fila = ctx.getImageData(0, Math.floor(lienzo.height / 2), lienzo.width, 1).data;
    let cambios = 0;
    for (let x = 4; x < fila.length; x += 4) if ((fila[x] < 128) !== (fila[x - 4] < 128)) cambios++;
    flujo.getTracks().forEach((t) => t.stop());
    return { ancho: lienzo.width, alto: lienzo.height, cambios };
  });
  expect(resultado.ancho).toBe(640);
  expect(resultado.alto).toBe(480);
  // 30 barras negras → unos 60 cambios entre negro y blanco.
  expect(resultado.cambios).toBeGreaterThanOrEqual(58);
});
