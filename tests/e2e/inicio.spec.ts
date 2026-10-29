import { expect, test } from "@playwright/test";
import { clienteAnon } from "../db/ayudante";

// Las secciones esperadas salen de la base (carta_secciones): tiene los datos reales.

test("la página de inicio carga en el celular sin errores en la consola", async ({ page }) => {
  const errores: string[] = [];
  page.on("console", (mensaje) => {
    if (mensaje.type() === "error") errores.push(mensaje.text());
  });
  page.on("pageerror", (error) => errores.push(error.message));

  const respuesta = await page.goto("/");

  expect(respuesta?.status()).toBe(200);
  expect(page.viewportSize()).toEqual({ width: 390, height: 844 });
  expect(errores).toEqual([]);
});

test("CA-1: muestra el logo, el buscador y las secciones en orden", async ({ page }) => {
  await page.goto("/");

  const logo = page.getByRole("img", { name: "Lehonor Enoboutique" });
  await expect(logo).toBeVisible();
  await expect(page.getByRole("link", { name: "Lehonor Enoboutique" })).toHaveAttribute("href", "/");

  const buscador = page.getByRole("searchbox", { name: /buscá/i });
  await expect(buscador).toBeVisible();

  // Se ignoran las secciones que crean otros tests en paralelo (empiezan con "test-").
  const secciones = page
    .getByRole("navigation", { name: "Secciones" })
    .getByRole("link")
    .filter({ hasNotText: /^test-/ });
  const { data } = await clienteAnon().from("carta_secciones").select("nombre").order("orden");
  const esperadas = (data ?? []).map((x) => x.nombre as string).filter((n) => !n.startsWith("test-"));
  expect(esperadas).toEqual(expect.arrayContaining(["Cava", "Tintos", "Blancos"]));
  await expect(secciones).toHaveText(esperadas);
  await expect(page.getByText("Próximamente")).toHaveCount(0);
});

test("CA-1: cada sección lleva a su página", async ({ page }) => {
  await page.goto("/");
  const cava = page.getByRole("navigation", { name: "Secciones" }).getByRole("link", { name: "Cava" });
  await expect(cava).toHaveAttribute("href", /^\/seccion\/[0-9a-f-]{36}$/);
});

test("el buscador envía a la página de resultados", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("form[role=search]")).toHaveAttribute("action", "/buscar");
  await expect(page.getByRole("searchbox")).toHaveAttribute("name", "q");
});
