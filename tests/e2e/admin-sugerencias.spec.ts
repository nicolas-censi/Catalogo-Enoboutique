import { expect, test } from "@playwright/test";
import { clienteAdmin, limpiarDatos, limpiarUsuarios, prefijo } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// Spec 007, CA-1, CA-5, CA-6 y CA-8: sugerencia de a uno desde la ficha, revisión,
// aprobación e interruptor de la IA (con la IA de prueba, IA_FALSA=1). El interruptor se
// prende para estos tests y al final vuelve a como estaba.
test.describe.configure({ mode: "serial" });

const admin = clienteAdmin();
const ids: Record<string, string> = {};
const nombre = `Rutini Malbec ${prefijo}`;
let iaPrevia = false;
const prenderIa = (activa: boolean) => admin.from("ajustes_ia").update({ activa }).eq("id", 1);

const fotosSugeridas = async (id: string) => ((await admin.storage.from("sugerencias").list(id)).data ?? []).map((f) => `${id}/${f.name}`);
const fotosPublicas = async (id: string) => ((await admin.storage.from("fotos").list(`productos/${id}`)).data ?? []).map((f) => `productos/${id}/${f.name}`);

async function borrarFotosSugeridas() {
  for (const id of Object.values(ids)) {
    const sugeridas = await fotosSugeridas(id);
    if (sugeridas.length) await admin.storage.from("sugerencias").remove(sugeridas);
    const publicas = await fotosPublicas(id);
    if (publicas.length) await admin.storage.from("fotos").remove(publicas);
  }
}

test.beforeAll(async () => {
  iaPrevia = (await admin.from("ajustes_ia").select("activa").eq("id", 1).single()).data!.activa;
  await prenderIa(true);
  const seccion = await admin.from("secciones").insert({ nombre: `${prefijo} Sugerencias`, orden: 96 }).select().single();
  for (const [clave, n] of [["producto", nombre], ["falla", `Vino [falla] ${prefijo}`], ["sinFoto", `Vino [sin foto] ${prefijo}`], ["soloFoto", `Catena Malbec ${prefijo}`]] as const) {
    const p = await admin.from("productos").insert({ tipo: "vino", nombre: n, seccion_id: seccion.data!.id }).select().single();
    ids[clave] = p.data!.id;
    await admin.from("anadas").insert({ producto_id: p.data!.id, codigo_tango: `${prefijo}-${clave}`, descripcion_tango: "X 2022", tipo: "con_anio", anio: 2022, precio: 30000, en_stock: true });
  }
});

test.afterAll(async () => {
  await prenderIa(iaPrevia);
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

test("CA-5 y CA-6: corrige el texto y aprueba todo; se ve en la carta y queda registrado quién", async ({ page }) => {
  const corregido = `Malbec de altura del Valle de Uco ${prefijo}, con crianza en roble francés.`;
  await page.goto(`/admin/productos/${ids.producto}`);
  const s = sugerencia(page);
  const campo = s.getByRole("textbox", { name: "Descripción (podés corregirla)" });
  // Espera a que la página esté hidratada antes de escribir en el campo controlado.
  await page.waitForLoadState("networkidle");
  await campo.fill(corregido);
  await expect(campo).toHaveValue(corregido);
  await expect(s.getByRole("checkbox", { name: "Usar la descripción" })).toBeChecked();
  await expect(s.getByRole("checkbox", { name: "Usar la foto" })).toBeChecked();
  await s.getByRole("button", { name: "Aprobar" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Listo. Ya se ve en la carta." })).toBeVisible();
  await expect(sugerencia(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sugerir con IA" })).toBeVisible();
  // El formulario del producto muestra la descripción nueva (para no pisarla al guardar).
  await expect(page.getByLabel("Descripción", { exact: true })).toHaveValue(corregido);

  const producto = (await admin.from("productos").select("descripcion, foto_path").eq("id", ids.producto).single()).data!;
  expect(producto.descripcion).toBe(corregido);
  expect(producto.foto_path).toMatch(new RegExp(`^productos/${ids.producto}/.+\\.webp$`));
  const fila = (await admin.from("sugerencias").select("estado, revisada_por, revisada_en, descripcion").eq("producto_id", ids.producto).single()).data!;
  expect(fila).toMatchObject({ estado: "aprobada", descripcion: corregido });
  expect(fila.revisada_por).toBeTruthy();
  expect(fila.revisada_en).toBeTruthy();
  expect(await fotosSugeridas(ids.producto)).toEqual([]);

  await page.goto(`/producto/${ids.producto}`);
  await expect(page.getByText(corregido)).toBeVisible();
  await expect(page.getByRole("img", { name: new RegExp(nombre) })).toBeVisible();
});

test("CA-5: aprueba solo la foto; la descripción queda como estaba", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.soloFoto}`);
  await page.getByRole("button", { name: "Sugerir con IA" }).click();
  const s = sugerencia(page);
  await s.getByRole("checkbox", { name: "Usar la descripción" }).uncheck();
  await s.getByRole("button", { name: "Aprobar" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Listo. Ya se ve en la carta." })).toBeVisible();
  const producto = (await admin.from("productos").select("descripcion, foto_path").eq("id", ids.soloFoto).single()).data!;
  expect(producto.descripcion).toBeNull();
  expect(producto.foto_path).toMatch(/\.webp$/);
});

test("CA-5: descarta; el producto queda como estaba y se puede pedir otra", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.sinFoto}`);
  await sugerencia(page).getByRole("button", { name: "Descartar" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Sugerencia descartada." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sugerir con IA" })).toBeVisible();
  expect((await admin.from("productos").select("descripcion, foto_path").eq("id", ids.sinFoto).single()).data).toEqual({ descripcion: null, foto_path: null });
  const fila = (await admin.from("sugerencias").select("estado, revisada_por").eq("producto_id", ids.sinFoto).single()).data!;
  expect(fila.estado).toBe("descartada");
  expect(fila.revisada_por).toBeTruthy();
});

test.describe("CA-8: interruptor de la IA", () => {
  test("un vendedor no tiene acceso a IA", async ({ page }) => {
    await page.goto("/admin/ia");
    await expect(page.getByText("No tenés acceso al panel.")).toBeVisible();
  });

  test("el encargado la apaga: en la ficha no se puede pedir y no se crea nada; la prende de nuevo", async ({ page, context }) => {
    await context.clearCookies();
    await entrarComo(context, "encargado");
    await page.goto("/admin");
    await page.getByRole("navigation", { name: "Panel" }).getByRole("link", { name: "IA", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Sugerencias por IA" })).toBeVisible();
    const interruptor = page.getByRole("switch", { name: "Sugerencias por IA" });
    await expect(interruptor).toHaveAttribute("aria-checked", "true");
    await interruptor.click();
    await expect(interruptor).toHaveAttribute("aria-checked", "false");
    await expect(interruptor).toHaveText("Apagadas");
    expect((await admin.from("ajustes_ia").select("activa").eq("id", 1).single()).data!.activa).toBe(false);

    await page.goto(`/admin/productos/${ids.falla}`);
    await expect(page.getByText("Las sugerencias por IA están apagadas.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sugerir con IA" })).toHaveCount(0);
    await page.getByRole("link", { name: "Prenderlas" }).click();
    await expect(page).toHaveURL(/\/admin\/ia$/);
    await page.getByRole("switch", { name: "Sugerencias por IA" }).click();
    await expect(page.getByRole("switch", { name: "Sugerencias por IA" })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByText(/Último cambio: /)).toBeVisible();
  });

  test("apagada, el vendedor ve el aviso y las sugerencias listas se siguen pudiendo revisar", async ({ page }) => {
    // Una sugerencia lista (llegó antes de apagar).
    await page.goto(`/admin/productos/${ids.sinFoto}`);
    await page.getByRole("button", { name: "Sugerir con IA" }).click();
    await expect(sugerencia(page)).toBeVisible();
    await prenderIa(false);

    await page.goto(`/admin/productos/${ids.falla}`);
    await expect(page.getByText("Las sugerencias por IA están apagadas. Pedile al encargado que las prenda.")).toBeVisible();
    const antes = (await admin.from("sugerencias").select("id").eq("producto_id", ids.falla)).data!.length;

    await page.goto(`/admin/productos/${ids.sinFoto}`);
    await sugerencia(page).getByRole("button", { name: "Aprobar" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Listo. Ya se ve en la carta." })).toBeVisible();
    expect((await admin.from("sugerencias").select("id").eq("producto_id", ids.falla)).data!.length).toBe(antes);
    await prenderIa(true);
  });
});
