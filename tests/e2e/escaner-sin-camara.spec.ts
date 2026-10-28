import { expect, test } from "@playwright/test";

// CA-4 (spec 003): sin permiso, sin cámara o sin soporte, explica y ofrece escribir el número.
for (const [caso, preparar, esperado] of [
  ["sin permiso", "NotAllowedError", /No tenemos permiso para usar la cámara/],
  ["sin cámara", "NotFoundError", /No encontramos una cámara/],
  ["cámara ocupada", "NotReadableError", /otra aplicación/],
  ["navegador sin acceso a la cámara", "sin-api", /no permite usar la cámara/],
] as const) {
  test(`CA-4: ${caso}`, async ({ page }) => {
    await page.addInitScript((error) => {
      if (error === "sin-api") {
        Object.defineProperty(navigator, "mediaDevices", { value: undefined });
      } else {
        navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("simulado", error));
      }
    }, preparar);
    await page.goto("/escanear");
    await expect(page.getByRole("status")).toHaveText(esperado);
    await expect(page.locator("video")).toBeHidden();

    await page.getByLabel("Número del código de barras", { exact: true }).fill("7798074860141");
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await expect(page.getByRole("article").getByRole("heading")).toHaveText(["Salentein Primus Malbec"]);
  });
}

test("un problema desconocido muestra su código para diagnosticar", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("simulado", "ErrorRaroDeCamara"));
  });
  await page.goto("/escanear");
  await expect(page.getByRole("status")).toHaveText(/no permite usar la cámara/);
  await expect(page.getByText("Código del problema: ErrorRaroDeCamara")).toBeVisible();
});

test("los problemas conocidos no muestran código técnico", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("simulado", "NotAllowedError"));
  });
  await page.goto("/escanear");
  await expect(page.getByRole("status")).toHaveText(/permiso/);
  await expect(page.getByText(/Código del problema/)).toHaveCount(0);
});
