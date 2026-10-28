import { expect, test, type Page } from "@playwright/test";
import { clienteAdmin, limpiarDatos, limpiarUsuarios, prefijo } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// Spec 005, CA-1: ordenar secciones arrastrando (computadora). Se crean dos secciones
// al final y solo se mueven entre ellas, para no cambiar el orden de los datos de ejemplo.
test.use({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false });
test.describe.configure({ mode: "serial" });

const admin = clienteAdmin();
const primera = `${prefijo} Orden primera`;
const segunda = `${prefijo} Orden segunda`;
const ids: Record<string, string> = {};

test.beforeAll(async () => {
  for (const [nombre, orden] of [[primera, 10000], [segunda, 10001]] as const) {
    const s = await admin.from("secciones").insert({ nombre, orden }).select().single();
    ids[nombre] = s.data!.id;
    const p = await admin.from("productos").insert({ tipo: "vino", nombre: `Vino de ${nombre}`, seccion_id: s.data!.id }).select().single();
    await admin
      .from("anadas")
      .insert({ producto_id: p.data!.id, codigo_tango: `${prefijo}-${orden}`, descripcion_tango: "X", tipo: "con_anio", anio: 2020, precio: 1000, en_stock: true });
  }
});

test.afterAll(async () => {
  await limpiarDatos();
  await limpiarUsuarios();
});

test.beforeEach(async ({ context }) => {
  await entrarComo(context, "vendedor");
});

const filas = (page: Page) => page.getByRole("table", { name: "Secciones" }).getByRole("row");
const manija = (page: Page, nombre: string) => page.getByRole("button", { name: `Mover ${nombre}` });
const ordenEnBase = async () => {
  const { data } = await admin.from("secciones").select("nombre").in("id", Object.values(ids)).order("orden");
  return data!.map((s) => s.nombre);
};
const ordenEnPantalla = async (page: Page) =>
  (await filas(page).filter({ hasText: `${prefijo} Orden` }).allTextContents()).map((t) => (t.includes("primera") ? primera : segunda));
/** Toma la sección con Espacio, la sube un lugar con la flecha y la suelta. */
async function subirConTeclado(page: Page, nombre: string) {
  const nombres = await page.getByRole("table", { name: "Secciones" }).getByRole("button", { name: /^Mover / }).evaluateAll((b) =>
    b.map((e) => e.getAttribute("aria-label")),
  );
  const posicion = nombres.indexOf(`Mover ${nombre}`) + 1;
  await manija(page, nombre).focus();
  await page.keyboard.press("Space");
  await expect(manija(page, nombre)).toHaveAttribute("aria-pressed", "true");
  // dnd-kit empieza a escuchar las flechas en el próximo ciclo (setTimeout): una persona
  // nunca es tan rápida, el test sí.
  await page.waitForTimeout(150);
  await page.keyboard.press("ArrowUp");
  // Cada movimiento se anuncia para el lector de pantalla (CA-4).
  await expect(page.getByText(`${nombre}, posición ${posicion - 1} de ${nombres.length}.`, { exact: true })).toBeAttached();
  await page.keyboard.press("Space");
}

const ordenEnCarta = async (page: Page) => {
  await page.goto("/");
  const enlaces = page.getByRole("navigation", { name: "Secciones" }).getByRole("link");
  await expect(enlaces.filter({ hasText: primera })).toBeVisible();
  return (await enlaces.allTextContents()).filter((t) => t.includes(`${prefijo} Orden`));
};

test("CA-1 y CA-4: con el teclado, mueve una sección, guarda solo y la carta cambia", async ({ page }) => {
  await page.goto("/admin/secciones");
  await expect(manija(page, segunda)).toBeVisible();
  await subirConTeclado(page, segunda);

  await expect(page.getByRole("status").filter({ hasText: "Orden guardado" })).toBeVisible();
  await expect.poll(ordenEnBase).toEqual([segunda, primera]);
  expect(await ordenEnPantalla(page)).toEqual([segunda, primera]);
  expect(await ordenEnCarta(page)).toEqual([segunda, primera]);
});

test("CA-1: con el mouse, arrastra una sección a otra posición", async ({ page }) => {
  await page.goto("/admin/secciones");
  const origen = await manija(page, primera).boundingBox();
  const destino = await manija(page, segunda).boundingBox();
  await page.mouse.move(origen!.x + origen!.width / 2, origen!.y + origen!.height / 2);
  await page.mouse.down();
  await page.mouse.move(destino!.x + destino!.width / 2, destino!.y - 10, { steps: 10 });
  await page.mouse.up();

  await expect(page.getByRole("status").filter({ hasText: "Orden guardado" })).toBeVisible();
  await expect.poll(ordenEnBase).toEqual([primera, segunda]);
});

test("CA-1: si no se puede guardar, avisa y vuelve al orden anterior", async ({ page }) => {
  await page.goto("/admin/secciones");
  await expect(manija(page, segunda)).toBeVisible();
  await page.route("**/admin/secciones", (ruta) =>
    ruta.request().method() === "POST" ? ruta.abort() : ruta.continue(),
  );
  await subirConTeclado(page, segunda);

  await expect(page.getByRole("alert").filter({ hasText: "No se pudo guardar el orden. Probá de nuevo." })).toBeVisible();
  expect(await ordenEnPantalla(page)).toEqual([primera, segunda]);
  expect(await ordenEnBase()).toEqual([primera, segunda]);
});
