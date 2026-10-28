import { expect, test } from "@playwright/test";
import { camaraSimulada } from "./video-codigo";

// CA-6 y CA-7 (spec 003). La cámara muestra un código que no está en la carta.
test.use(camaraSimulada("7790001234568"));

test("CA-6: la carta no descarga nada del escáner hasta abrirlo", async ({ page }) => {
  const pedidos: string[] = [];
  page.on("request", (p) => pedidos.push(p.url()));
  await page.goto("/");
  await page.getByRole("link", { name: "Cava" }).click();
  await page.getByRole("link", { name: "Rutini Malbec" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Rutini Malbec" })).toBeVisible();
  expect(pedidos.filter((u) => /zxing|\.wasm/.test(u))).toEqual([]);
});

test("CA-7: no manda imágenes a ningún servidor, solo el número para buscar", async ({ page }) => {
  const envios: { url: string; tipo: string; tamano: number }[] = [];
  page.on("request", (p) => {
    if (p.method() !== "GET") {
      envios.push({ url: p.url(), tipo: p.headers()["content-type"] ?? "", tamano: p.postDataBuffer()?.length ?? 0 });
    }
  });
  await page.goto("/escanear");
  await expect(page.getByRole("status")).toHaveText("No encontramos ese código en la carta.", { timeout: 20_000 });
  expect(envios.filter((e) => e.tipo.startsWith("image/") || e.tamano > 2000)).toEqual([]);
  expect(envios.some((e) => e.url.includes("/rpc/buscar_por_codigo_barras"))).toBe(true);
});
