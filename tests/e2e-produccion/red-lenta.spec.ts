import { expect, test, type Page } from "@playwright/test";

// CA-9: con la señal de adentro del local (simulada como 3G rápido), la carta se ve sin
// esperar JavaScript y el buscador no descarga la carta entera.
// Usa los datos de ejemplo del proyecto de desarrollo (npm run db:seed).

async function simular3G(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  // Perfil "Fast 3G" de Chrome DevTools.
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 562.5,
    downloadThroughput: ((1.6 * 1024 * 1024) / 8) * 0.9,
    uploadThroughput: ((750 * 1024) / 8) * 0.9,
  });
}

test("el contenido de cada pantalla se ve antes de que cargue JavaScript", async ({ page }) => {
  await simular3G(page);
  // Se bloquea todo el JavaScript: lo que se vea es lo que llega armado en el HTML.
  await page.route(/\.js(\?|$)/, (ruta) => ruta.abort());

  const medir = async (accion: () => Promise<unknown>, visible: () => Promise<void>) => {
    const inicio = Date.now();
    await accion();
    await visible();
    return (Date.now() - inicio) / 1000;
  };

  const inicio = await medir(
    () => page.goto("/", { waitUntil: "commit" }),
    () => expect(page.getByRole("link", { name: "Cava" })).toBeVisible(),
  );
  const seccion = await medir(
    () => page.getByRole("link", { name: "Cava" }).click(),
    () => expect(page.getByRole("heading", { level: 1, name: "Cava" })).toBeVisible(),
  );
  const detalle = await medir(
    () => page.getByRole("link", { name: "Rutini Malbec" }).click(),
    () => expect(page.getByRole("heading", { level: 1, name: "Rutini Malbec" })).toBeVisible(),
  );

  console.log(`Con 3G y sin JS: inicio ${inicio}s, sección ${seccion}s, detalle ${detalle}s.`);
  for (const segundos of [inicio, seccion, detalle]) expect(segundos).toBeLessThan(5);
});

test("el buscador solo pide los resultados, nunca la carta entera", async ({ page }) => {
  await simular3G(page);
  const pedidos: { url: string; bytes: number }[] = [];
  page.on("response", async (respuesta) => {
    if (respuesta.url().includes("/rest/v1/")) {
      pedidos.push({ url: respuesta.url(), bytes: (await respuesta.body()).length });
    }
  });

  await page.goto("/");
  await page.getByRole("searchbox").pressSequentially("rutini", { delay: 50 });
  // Con los productos reales de Tango hay varios Rutini (como mucho 30 resultados).
  await expect(page.getByRole("region", { name: "Resultados" }).getByRole("article").first()).toBeVisible();

  expect(pedidos.length).toBeGreaterThan(0);
  expect(pedidos.every((p) => p.url.includes("/rpc/buscar_carta"))).toBe(true);
  const total = pedidos.reduce((suma, p) => suma + p.bytes, 0);
  console.log(`El buscador descargó ${total} bytes en ${pedidos.length} pedido(s).`);
  // La carta entera pesa más de 1 MB; los resultados, unos pocos KB.
  expect(total).toBeLessThan(60_000);
});
