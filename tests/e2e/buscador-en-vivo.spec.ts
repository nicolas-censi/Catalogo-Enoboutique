import { expect, test } from "@playwright/test";
import { crearDatosBusqueda, type DatosBusqueda } from "./datos-busqueda";

// Datos propios (marca inventada): la base tiene los productos reales de Tango.
// El código de barras es el de un producto de ejemplo (npm run db:seed).
let d: DatosBusqueda;
test.beforeAll(async () => {
  d = await crearDatosBusqueda();
});
test.afterAll(async () => {
  await d.borrar();
});
/** La marca con una letra menos, para probar que tolera errores. */
const conError = (texto: string) => texto.toLowerCase().slice(0, 4) + texto.toLowerCase().slice(5);

const resultados = (page: import("@playwright/test").Page) =>
  page.getByRole("region", { name: "Resultados" });

test("CA-5: los resultados aparecen mientras se escribe, sin apretar Buscar", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("searchbox").pressSequentially(`${conError(d.marca)} malbec`, { delay: 60 });
  await expect(resultados(page).getByRole("article").getByRole("heading").first()).toHaveText(d.nombres.malbec);
  await expect(page).toHaveURL(/\/$/);
});

test("CA-6: un código de barras completo trae el producto mientras se escribe", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("searchbox").fill("7798074860141");
  await expect(resultados(page).getByRole("heading")).toHaveText(["Salentein Primus Malbec"]);
});

test("CA-7: sin resultados muestra el mensaje", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("searchbox").fill("heladera");
  await expect(resultados(page).getByText(/No encontramos nada para “heladera”/)).toBeVisible();
});

test("al borrar el texto desaparecen los resultados y quedan las secciones", async ({ page }) => {
  await page.goto("/");
  const buscador = page.getByRole("searchbox");
  await buscador.fill(d.marca);
  await expect(resultados(page).getByRole("article")).toHaveCount(2);
  await buscador.fill("");
  await expect(resultados(page)).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Secciones" })).toBeVisible();
});

test("espera a que se termine de escribir: no consulta por cada letra", async ({ page }) => {
  const consultas: string[] = [];
  page.on("request", (pedido) => {
    if (pedido.url().includes("/rpc/buscar_carta")) consultas.push(pedido.postData() ?? "");
  });
  await page.goto("/");
  await page.getByRole("searchbox").pressSequentially(d.bodega, { delay: 40 });
  await expect(resultados(page).getByRole("article")).toHaveCount(3);
  expect(consultas.length).toBeLessThanOrEqual(2);
  expect(consultas.at(-1)).toContain(d.bodega);
});

test("con Enter sigue llevando a la página de resultados", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("searchbox").fill("rutini");
  await page.getByRole("searchbox").press("Enter");
  await expect(page).toHaveURL(/\/buscar\?q=rutini$/);
});
