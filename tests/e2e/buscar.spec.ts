import { expect, test } from "@playwright/test";

// Usa los datos de ejemplo del proyecto de desarrollo (npm run db:seed).
// Sin JavaScript: la página de resultados tiene que funcionar igual (CA-9).
test.use({ javaScriptEnabled: false });

const resultados = (page: import("@playwright/test").Page) =>
  page.getByRole("region", { name: "Resultados" }).getByRole("article").getByRole("heading");

test("CA-5: buscar desde el inicio lleva a los resultados, sin JavaScript", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("searchbox").fill("rutni");
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page).toHaveURL(/\/buscar\?q=rutni$/);
  await expect(resultados(page)).toHaveText(["Rutini Malbec"]);
  // El buscador conserva lo que se escribió.
  await expect(page.getByRole("searchbox")).toHaveValue("rutni");
});

test("CA-5: tolera errores y tildes, y busca por bodega", async ({ page }) => {
  await page.goto("/buscar?q=zucardi");
  await expect(resultados(page)).toContainText(["Zuccardi Q Malbec"]);

  await page.goto("/buscar?q=salent%C3%A9in%20primus");
  await expect(resultados(page).first()).toHaveText("Salentein Primus Malbec");

  await page.goto("/buscar?q=salentein");
  await expect(resultados(page)).toHaveCount(2);
  for (const nombre of ["Salentein Primus Malbec", "Salentein Brut Nature"]) {
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
  await page.goto("/buscar?q=magnum");
  await expect(page.getByRole("article")).toHaveCount(0);
});

test("sin texto, la página de búsqueda solo muestra el buscador", async ({ page }) => {
  await page.goto("/buscar");
  await expect(page.getByRole("searchbox")).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(0);
  await expect(page.getByText(/No encontramos/)).toHaveCount(0);
});
