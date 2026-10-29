import { expect, test, type Page } from "@playwright/test";
import { clienteAdmin, limpiarDatos, limpiarUsuarios, prefijo } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// Spec 008, CA-12: mover varios productos a una sección desde la lista (computadora).
test.use({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false });
test.describe.configure({ mode: "serial" });

const admin = clienteAdmin();
const n = (nombre: string) => `${prefijo} ${nombre}`;
const ids: Record<string, string> = {};

test.beforeAll(async () => {
  const seccion = async (clave: string, nombre: string, extra: Record<string, unknown> = {}) =>
    (ids[clave] = (await admin.from("secciones").insert({ nombre: n(nombre), orden: 96000, ...extra }).select().single()).data!.id);
  await seccion("origen", "Origen mover");
  await seccion("destino", "Destino mover");
  await seccion("cava", "Cava mover");
  await seccion("joyitas", "Joyitas mover", { seccion_padre_id: ids.cava, orden: 1 });
  for (const nombre of ["Uno", "Dos", "Tres", "Cuatro"]) {
    // Nombres que empiezan igual: la búsqueda los trae juntos.
    ids[nombre] = (await admin.from("productos").insert({ tipo: "vino", nombre: `Mover ${nombre} ${prefijo}`, seccion_id: ids.origen }).select().single()).data!.id;
  }
});

test.afterAll(async () => {
  await limpiarDatos();
  await limpiarUsuarios();
});

test.beforeEach(async ({ context }) => {
  await entrarComo(context, "vendedor");
});

const seccionDe = async (clave: string) => (await admin.from("productos").select("seccion_id").eq("id", ids[clave]).single()).data!.seccion_id;
const fila = (page: Page, nombre: string) => page.getByRole("table").getByRole("row").filter({ hasText: `Mover ${nombre} ${prefijo}` });

test("CA-12: tilda dos productos y los mueve juntos a otra sección", async ({ page }) => {
  await page.goto(`/admin?q=${encodeURIComponent(`mover ${prefijo}`)}`);
  await fila(page, "Uno").getByRole("checkbox").check();
  await fila(page, "Dos").getByRole("checkbox").check();
  await expect(page.getByText("2 seleccionados")).toBeVisible();
  await page.getByLabel("Mover a la sección").selectOption({ label: n("Destino mover") });
  await page.getByRole("button", { name: "Mover", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Se movieron" })).toHaveText(`Se movieron 2 productos a ${n("Destino mover")}.`);
  expect(await seccionDe("Uno")).toBe(ids.destino);
  expect(await seccionDe("Dos")).toBe(ids.destino);
  expect(await seccionDe("Tres")).toBe(ids.origen);
  await expect(fila(page, "Uno")).toContainText(n("Destino mover"));
});

test("CA-12: con un filtro, mueve todos los que coinciden; una sección con subsecciones no se elige", async ({ page }) => {
  await page.goto(`/admin?q=${encodeURIComponent(`mover ${prefijo}`)}&seccion=${ids.origen}`);
  await expect(page.getByRole("table").getByRole("row").filter({ has: page.getByRole("checkbox") }).filter({ hasText: "Mover" })).toHaveCount(2);
  await page.getByRole("button", { name: "Seleccionar los 2 del filtro" }).click();
  const selector = page.getByLabel("Mover a la sección");
  await expect(selector.locator(`option[value="${ids.cava}"]`)).toHaveCount(0);
  await selector.selectOption({ label: `${n("Cava mover")} › ${n("Joyitas mover")}` });
  await page.getByRole("button", { name: "Mover", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Se movieron" })).toHaveText(
    `Se movieron 2 productos a ${n("Cava mover")} › ${n("Joyitas mover")}.`,
  );
  expect(await seccionDe("Tres")).toBe(ids.joyitas);
  expect(await seccionDe("Cuatro")).toBe(ids.joyitas);
  expect(await seccionDe("Uno")).toBe(ids.destino);
});
