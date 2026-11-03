import { expect, test } from "@playwright/test";
import { clienteAdmin, limpiarDatos, limpiarUsuarios, prefijo } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// Spec 007, CA-1: sugerencia de a uno desde la ficha (con la IA de prueba, IA_FALSA=1).
test.describe.configure({ mode: "serial" });

const admin = clienteAdmin();
const ids: Record<string, string> = {};
const nombre = `Rutini Malbec ${prefijo}`;

async function borrarFotosSugeridas() {
  for (const id of Object.values(ids)) {
    const { data } = await admin.storage.from("sugerencias").list(id);
    if (data?.length) await admin.storage.from("sugerencias").remove(data.map((f) => `${id}/${f.name}`));
  }
}

test.beforeAll(async () => {
  const seccion = await admin.from("secciones").insert({ nombre: `${prefijo} Sugerencias`, orden: 96 }).select().single();
  for (const [clave, n] of [["producto", nombre], ["falla", `Vino [falla] ${prefijo}`], ["sinFoto", `Vino [sin foto] ${prefijo}`]] as const) {
    const p = await admin.from("productos").insert({ tipo: "vino", nombre: n, seccion_id: seccion.data!.id }).select().single();
    ids[clave] = p.data!.id;
  }
});

test.afterAll(async () => {
  await borrarFotosSugeridas();
  await limpiarDatos();
  await limpiarUsuarios();
});

test.beforeEach(async ({ context }) => {
  await entrarComo(context, "vendedor");
});

const sugerencia = (page: import("@playwright/test").Page) => page.getByRole("article", { name: "Sugerencia de la IA" });

test("CA-1: un vendedor pide la sugerencia, ve el aviso de espera y después la sugerencia con foto y fuentes", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.producto}`);
  await page.getByRole("button", { name: "Sugerir con IA" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Buscando información… puede tardar hasta un minuto." })).toBeVisible();
  const s = sugerencia(page);
  await expect(s).toBeVisible();
  await expect(s.getByRole("region", { name: "Descripción sugerida" })).toContainText(`${nombre}: un clásico de la casa`);
  await expect(s.getByRole("region", { name: "Descripción actual" })).toContainText("Sin descripción");
  await expect(s.getByRole("img", { name: `Foto sugerida de ${nombre}` })).toBeVisible();
  await expect(s.getByText("Foto de ia-falsa.invalid")).toBeVisible();
  await expect(s.getByRole("region", { name: "De dónde salió" }).getByRole("link", { name: "ia-falsa.invalid" })).toBeVisible();

  const fila = (await admin.from("sugerencias").select("estado, busquedas, costo_usd, foto_path").eq("producto_id", ids.producto).single()).data!;
  expect(fila).toMatchObject({ estado: "lista", busquedas: 3 });
  expect(Number(fila.costo_usd)).toBeGreaterThan(0);
  expect(fila.foto_path).toMatch(new RegExp(`^${ids.producto}/.+\\.webp$`));
  // La carta no cambió (CA-6).
  expect((await admin.from("productos").select("descripcion, foto_path").eq("id", ids.producto).single()).data).toEqual({ descripcion: null, foto_path: null });
});

test("CA-1: con una sugerencia esperando revisión, no se pide otra (se muestra esa)", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.producto}`);
  await expect(sugerencia(page)).toBeVisible();
  await expect(page.getByRole("button", { name: "Sugerir con IA" })).toHaveCount(0);
});

test("CA-4: sin foto oficial, lo dice", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.sinFoto}`);
  await page.getByRole("button", { name: "Sugerir con IA" }).click();
  await expect(sugerencia(page).getByRole("region", { name: "Foto sugerida" })).toContainText("No encontré una foto oficial.");
});

test("CA-1: si falla, avisa y la ficha queda como estaba (se puede volver a pedir)", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.falla}`);
  await page.getByRole("button", { name: "Sugerir con IA" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "No se pudo pedir" })).toHaveText("No se pudo pedir la sugerencia. Probá de nuevo más tarde.");
  await expect(sugerencia(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sugerir con IA" })).toBeEnabled();
  expect((await admin.from("sugerencias").select("estado").eq("producto_id", ids.falla).single()).data!.estado).toBe("fallo");
});
