import { expect, test } from "@playwright/test";
import { camaraSimulada } from "./video-codigo";

// CA-9 (spec 003): un código chico en una imagen de alta resolución (como cuando el
// celular está a la distancia justa para enfocar) se lee igual. 2 px por barra fina.
const SALENTEIN_PRIMUS = "/producto/5eed0000-0000-4000-8000-000000000202";
test.use(camaraSimulada("7798074860141", { ancho: 1920, alto: 1080, escala: 2 }));

test("CA-9: lee un código chico, lejos de la cámara", async ({ page }) => {
  await page.goto("/escanear");
  await expect(page).toHaveURL(SALENTEIN_PRIMUS, { timeout: 15_000 });
});
