import { expect, test, type Page } from "@playwright/test";
import { clienteAdmin, limpiarDatos, limpiarUsuarios, prefijo } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// Spec 011, CA-2 y CA-6: elegir la subsección de un producto y filtrar por sección.
test.use({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false });

const admin = clienteAdmin();
const n = (nombre: string) => `${prefijo} ${nombre}`;
const ids: Record<string, string> = {};

test.beforeAll(async () => {
  const seccion = async (clave: string, nombre: string, extra: Record<string, unknown> = {}) =>
    (ids[clave] = (await admin.from("secciones").insert({ nombre: n(nombre), orden: 70000, ...extra }).select().single()).data!.id);
  await seccion("padre", "Cava filtro");
  await seccion("a", "Joyitas filtro", { seccion_padre_id: ids.padre, orden: 1 });
  await seccion("b", "Añadas filtro", { seccion_padre_id: ids.padre, orden: 2 });
  await seccion("suelta", "Tintos filtro");
  const producto = async (clave: string, nombre: string, seccion_id: string) =>
    (ids[clave] = (await admin.from("productos").insert({ tipo: "vino", nombre: `Filtro ${nombre} ${prefijo}`, seccion_id }).select().single()).data!.id);
  await producto("enA", "Joya", ids.a);
  await producto("enB", "Añada", ids.b);
  await producto("enSuelta", "Tinto", ids.suelta);
});

test.afterAll(async () => {
  await limpiarDatos();
  await limpiarUsuarios();
});

test.beforeEach(async ({ context }) => {
  await entrarComo(context, "vendedor");
});

const nombresEnLista = async (page: Page) =>
  (await page.getByRole("table").getByRole("link").allTextContents()).filter((t) => t.includes(prefijo));

test("CA-2: en la ficha se elige una subsección; la sección que las tiene no se puede elegir", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.enSuelta}`);
  const selector = page.getByRole("combobox", { name: "Sección" });
  const opciones = await selector.locator("option").allTextContents();
  expect(opciones).toContain(n("Tintos filtro"));
  expect(opciones).toContain(`${n("Cava filtro")} › ${n("Joyitas filtro")}`);
  expect(opciones).toContain(`${n("Cava filtro")} › ${n("Añadas filtro")}`);
  // La sección con subsecciones es solo un título del grupo.
  await expect(selector.locator(`option[value="${ids.padre}"]`)).toHaveCount(0);
  await expect(selector.locator(`optgroup[label="${n("Cava filtro")}"] option`)).toHaveCount(2);

  await selector.selectOption({ label: `${n("Cava filtro")} › ${n("Añadas filtro")}` });
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("status")).toHaveText("Cambios guardados.");
  const { data } = await admin.from("productos").select("seccion_id").eq("id", ids.enSuelta).single();
  expect(data!.seccion_id).toBe(ids.b);
  // Se devuelve a su lugar para el resto de los tests.
  await admin.from("productos").update({ seccion_id: ids.suelta }).eq("id", ids.enSuelta);
});

test("CA-6: filtrar por la sección trae también sus subsecciones, y se puede filtrar por una", async ({ page }) => {
  await page.goto(`/admin?q=${encodeURIComponent(`filtro ${prefijo}`)}&seccion=${ids.padre}`);
  expect((await nombresEnLista(page)).sort()).toEqual([`Filtro Añada ${prefijo}`, `Filtro Joya ${prefijo}`]);
  await expect(page.getByRole("row").filter({ hasText: `Filtro Joya ${prefijo}` })).toContainText(`${n("Cava filtro")} › ${n("Joyitas filtro")}`);

  await page.getByLabel("Sección", { exact: true }).selectOption({ label: `${n("Cava filtro")} › ${n("Joyitas filtro")}` });
  await page.getByRole("button", { name: "Filtrar" }).click();
  await expect.poll(() => nombresEnLista(page)).toEqual([`Filtro Joya ${prefijo}`]);
});
