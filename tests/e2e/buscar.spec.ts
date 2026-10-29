import { expect, test } from "@playwright/test";
import { crearDatosBusqueda, type DatosBusqueda } from "./datos-busqueda";

// Datos propios (marca y bodega inventadas): la base tiene los productos reales de Tango.
// Los de código de barras y añadas usan productos de ejemplo (npm run db:seed).
let d: DatosBusqueda;
test.beforeAll(async () => {
  d = await crearDatosBusqueda();
});
test.afterAll(async () => {
  await d.borrar();
});
const conError = (texto: string) => texto.toLowerCase().slice(0, 4) + texto.toLowerCase().slice(5);
// Sin JavaScript: la página de resultados tiene que funcionar igual (CA-9).
test.use({ javaScriptEnabled: false });

const resultados = (page: import("@playwright/test").Page) =>
  page.getByRole("region", { name: "Resultados" }).getByRole("article").getByRole("heading");

test("CA-5: buscar desde el inicio lleva a los resultados, sin JavaScript", async ({ page }) => {
  const texto = `${conError(d.marca)} malbec`;
  await page.goto("/");
  await page.getByRole("searchbox").fill(texto);
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page).toHaveURL(new RegExp(`/buscar\\?q=${conError(d.marca)}`));
  await expect(resultados(page).first()).toHaveText(d.nombres.malbec);
  // El buscador conserva lo que se escribió.
  await expect(page.getByRole("searchbox")).toHaveValue(texto);
});

test("CA-5: tolera errores y tildes, y busca por bodega", async ({ page }) => {
  await page.goto(`/buscar?q=${encodeURIComponent(conError(d.marca))}`);
  await expect(resultados(page)).toContainText([d.nombres.malbec]);

  // Con tilde y en mayúsculas.
  await page.goto(`/buscar?q=${encodeURIComponent(`${d.marca.toUpperCase()} GRÁN RESERVA`)}`);
  await expect(resultados(page).first()).toHaveText(d.nombres.reserva);

  await page.goto(`/buscar?q=${encodeURIComponent(d.bodega)}`);
  await expect(resultados(page)).toHaveCount(3);
  for (const nombre of [d.nombres.malbec, d.nombres.reserva, d.nombres.chardonnay]) {
    await expect(resultados(page).filter({ hasText: nombre })).toHaveCount(1);
  }
});

test("CA-5: los resultados muestran las añadas con sus precios", async ({ page }) => {
  await page.goto("/buscar?q=rutini");
  const rutini = page.getByRole("article").filter({ hasText: "Rutini Malbec" });
  await expect(rutini.getByRole("listitem")).toHaveCount(5);
  await expect(rutini.getByRole("listitem").first()).toHaveText(/2023\s*\$\s*36\.000/);
});

test("CA-6: un código de barras completo trae el producto", async ({ page }) => {
  await page.goto("/buscar?q=7798074860141");
  await expect(resultados(page)).toHaveText(["Salentein Primus Malbec"]);
});

test("CA-7: sin resultados muestra un mensaje amable", async ({ page }) => {
  await page.goto("/buscar?q=heladera");
  await expect(page.getByText(/No encontramos nada para “heladera”/)).toBeVisible();
  await expect(page.getByText(/Probá con otro nombre o consultá al personal/)).toBeVisible();
});

test("CA-8: no encuentra productos de secciones ocultas", async ({ page }) => {
  await page.goto(`/buscar?q=${encodeURIComponent(`${d.marca} escondido`)}`);
  await expect(page.getByRole("article").filter({ hasText: d.nombres.escondido })).toHaveCount(0);
  await expect(page.getByRole("article").filter({ hasText: d.nombres.malbec })).toHaveCount(1);
});

test("sin texto, la página de búsqueda solo muestra el buscador", async ({ page }) => {
  await page.goto("/buscar");
  await expect(page.getByRole("searchbox")).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(0);
  await expect(page.getByText(/No encontramos/)).toHaveCount(0);
});
