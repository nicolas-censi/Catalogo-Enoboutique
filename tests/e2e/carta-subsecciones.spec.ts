import { expect, test, type Page } from "@playwright/test";
import { clienteAdmin, limpiarDatos, prefijo } from "../db/ayudante";

// Spec 011, CA-3 y CA-4: una sección con subsecciones en la carta.
const admin = clienteAdmin();
const n = (nombre: string) => `${prefijo} ${nombre}`;
const ids: Record<string, string> = {};
let contador = 0;

async function seccion(nombre: string, extra: Record<string, unknown> = {}) {
  ids[nombre] = (await admin.from("secciones").insert({ nombre: n(nombre), orden: 50000, ...extra }).select().single()).data!.id;
  return ids[nombre];
}
async function producto(nombre: string, seccionId: string, bodega: string | null, precio: number, orden: number | null = null) {
  const p = await admin.from("productos").insert({ tipo: "vino", nombre: n(nombre), seccion_id: seccionId, bodega_id: bodega, orden }).select().single();
  await admin
    .from("anadas")
    .insert({ producto_id: p.data!.id, codigo_tango: `${prefijo}-cs-${++contador}`, descripcion_tango: "X", tipo: "con_anio", anio: 2020, precio, en_stock: true });
}

test.beforeAll(async () => {
  const cava = await seccion("Cava con sub");
  // Se cargan en otro orden que el de la carta: manda subseccion.orden.
  const experiencias = await seccion("Experiencias", { seccion_padre_id: cava, orden: 3 });
  const joyitas = await seccion("Joyitas", { seccion_padre_id: cava, orden: 1 });
  const anadas = await seccion("Añadas", { seccion_padre_id: cava, orden: 2 });
  await seccion("Oculta", { seccion_padre_id: cava, orden: 4, visible: false });
  await seccion("Vacía", { seccion_padre_id: cava, orden: 5 });
  const bodega = async (nombre: string) => (await admin.from("bodegas").insert({ nombre: n(nombre) }).select().single()).data!.id;
  const alfa = await bodega("Alfa");
  const beta = await bodega("Beta");

  await producto("Joya Beta", joyitas, beta, 900);
  await producto("Joya Alfa", joyitas, alfa, 100);
  await producto("Joya destacada", joyitas, beta, 50, 1);
  await producto("Añada Alfa", anadas, alfa, 500);
  await producto("Experiencia", experiencias, null, 2000);
  await producto("Escondido", ids["Oculta"], null, 1000);
});

test.afterAll(limpiarDatos);

const sinPrefijo = (textos: string[]) => textos.map((t) => t.replace(`${prefijo} `, ""));

async function revisar(page: Page) {
  await page.goto(`/seccion/${ids["Cava con sub"]}`);
  await expect(page.getByRole("heading", { level: 1, name: n("Cava con sub") })).toBeVisible();

  // Accesos a cada subsección, en orden, sin las ocultas ni las vacías.
  const accesos = page.getByRole("navigation", { name: "Subsecciones" }).getByRole("link");
  expect(sinPrefijo(await accesos.allTextContents())).toEqual(["Joyitas", "Añadas", "Experiencias"]);
  await expect(accesos.first()).toHaveAttribute("href", `#subseccion-${ids["Joyitas"]}`);

  // Un título por subsección, con sus productos debajo y el orden de la spec 005.
  expect(sinPrefijo(await page.getByRole("heading", { level: 2 }).allTextContents())).toEqual(["Joyitas", "Añadas", "Experiencias"]);
  const productosDe = async (sub: string) =>
    sinPrefijo(await page.locator(`#subseccion-${ids[sub]}`).getByRole("article").getByRole("heading").allTextContents());
  expect(await productosDe("Joyitas")).toEqual(["Joya destacada", "Joya Alfa", "Joya Beta"]);
  expect(await productosDe("Añadas")).toEqual(["Añada Alfa"]);
  expect(await productosDe("Experiencias")).toEqual(["Experiencia"]);
  await expect(page.getByText(n("Escondido"))).toHaveCount(0);
}

test("CA-3 y CA-4: títulos y accesos por subsección, con su orden", async ({ page }) => {
  await revisar(page);
  await page.getByRole("navigation", { name: "Subsecciones" }).getByRole("link", { name: n("Experiencias") }).click();
  await expect(page).toHaveURL(new RegExp(`#subseccion-${ids["Experiencias"]}$`));
  await expect(page.getByRole("heading", { level: 2, name: n("Experiencias") })).toBeInViewport();
});

test.describe("sin JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("CA-3: se ve igual", async ({ page }) => {
    await revisar(page);
  });
});

// Que el inicio liste la sección y no sus subsecciones lo cubre tests/db/subsecciones.test.ts
// (carta_secciones): acá el inicio tiene un minuto de caché.
