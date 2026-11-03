import { expect, test } from "@playwright/test";
import { clienteAdmin, limpiarDatos, limpiarUsuarios, prefijo } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";
import { desborde, erroresGraves, tocablesChicos } from "./chequeos-celular";

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
    await page.getByRole("navigation", { name: "Panel" }).getByRole("link", { name: "Ajustes" }).click();
    await page.getByRole("link", { name: /^IA/ }).click();
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

test.describe("CA-2: de a muchos desde la lista de Productos", () => {
  test("tilda varios: ve cuántos y el costo estimado; confirma y quedan en la cola (sin los completos)", async ({ page }) => {
    const crear = async (clave: string, n: string, completo: boolean) => {
      const p = await admin
        .from("productos")
        .insert({ tipo: "vino", nombre: `${n} ${prefijo}`, ...(completo ? { descripcion: "Ya tiene", foto_path: "productos/x/y.webp" } : {}) })
        .select()
        .single();
      ids[clave] = p.data!.id;
    };
    await crear("listaA", "Lote Alfa", false);
    await crear("listaB", "Lote Beta", false);
    await crear("listaC", "Lote Gama", true);

    await page.goto(`/admin?q=${encodeURIComponent(`Lote ${prefijo}`)}`);
    for (const n of ["Lote Alfa", "Lote Beta", "Lote Gama"]) await page.getByRole("checkbox", { name: `Elegir ${n} ${prefijo}` }).check();
    await page.getByRole("button", { name: "Sugerir con IA" }).click();
    const confirmar = page.getByRole("group", { name: "Sugerir con IA" });
    await expect(confirmar).toContainText(/Vas a pedir 2 sugerencias\. Costo estimado: US\$ \d+,\d{2}\./);
    // Cancelar no pide nada.
    await confirmar.getByRole("button", { name: "Cancelar" }).click();
    expect((await admin.from("sugerencias").select("id").in("producto_id", [ids.listaA, ids.listaB, ids.listaC])).data).toEqual([]);

    await page.getByRole("button", { name: "Sugerir con IA" }).click();
    await page.getByRole("group", { name: "Sugerir con IA" }).getByRole("button", { name: "Sí, pedir" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Las 2 sugerencias van a ir llegando a Para revisar." })).toBeVisible();
    const filas = (await admin.from("sugerencias").select("producto_id, estado").in("producto_id", [ids.listaA, ids.listaB, ids.listaC])).data!;
    expect(filas.map((f) => f.producto_id).sort()).toEqual([ids.listaA, ids.listaB].sort());
    expect(filas.every((f) => f.estado === "en_cola")).toBe(true);
  });

  test("con Incluir los que ya tienen y todos los del filtro, pide también los completos; no repite los que ya están pedidos", async ({ page }) => {
    await page.goto(`/admin?q=${encodeURIComponent(`Lote ${prefijo}`)}`);
    const boton = page.getByRole("button", { name: /Seleccionar los \d+ del filtro/ });
    const enFiltro = Number((await boton.textContent())!.match(/\d+/)![0]);
    await boton.click();
    await page.getByRole("checkbox", { name: "Incluir los que ya tienen descripción y foto" }).check();
    await page.getByRole("button", { name: "Sugerir con IA" }).click();
    // Todos los del filtro (en todas las páginas) menos los que ya tienen una pedida o lista.
    const activas = (await admin.from("sugerencias").select("producto_id").in("estado", ["en_cola", "procesando", "lista"]).in("producto_id", Object.values(ids))).data!.length;
    const esperados = enFiltro - activas;
    expect(esperados).toBeGreaterThan(0);
    await expect(page.getByRole("group", { name: "Sugerir con IA" })).toContainText(`Vas a pedir ${esperados} ${esperados === 1 ? "sugerencia" : "sugerencias"}.`);
  });

  test("con la IA apagada, la lista no ofrece pedir sugerencias", async ({ page }) => {
    await prenderIa(false);
    await page.goto(`/admin?q=${encodeURIComponent(`Lote ${prefijo}`)}`);
    await expect(page.getByRole("checkbox", { name: `Elegir Lote Alfa ${prefijo}` })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sugerir con IA" })).toHaveCount(0);
    await prenderIa(true);
  });
});

test.describe("CA-2: la cola desde el cron", () => {
  test("sin la clave del cron no hace nada; con la clave procesa la cola; con la IA apagada no gasta", async ({ request }) => {
    const enCola = async (n: number) => {
      const p = await admin.from("productos").insert({ tipo: "vino", nombre: `Cola ${n} ${prefijo}` }).select().single();
      ids[`cola${n}`] = p.data!.id;
      return (await admin.from("sugerencias").insert({ producto_id: p.data!.id }).select("id").single()).data!.id;
    };
    const a = await enCola(1);
    const b = await enCola(2);
    expect((await request.get("/api/sugerencias/procesar")).status()).toBe(401);
    expect((await request.get("/api/sugerencias/procesar", { headers: { authorization: "Bearer otra" } })).status()).toBe(401);

    await prenderIa(false);
    const apagada = await request.get("/api/sugerencias/procesar", { headers: { authorization: "Bearer secreto-de-prueba-e2e" } });
    expect(await apagada.json()).toMatchObject({ listas: 0, motivo: "apagada" });
    expect((await admin.from("sugerencias").select("estado").in("id", [a, b])).data!.map((s) => s.estado)).toEqual(["en_cola", "en_cola"]);

    await prenderIa(true);
    const r = await request.get("/api/sugerencias/procesar", { headers: { authorization: "Bearer secreto-de-prueba-e2e" } });
    expect(await r.json()).toMatchObject({ fallidas: 0, quedan: 0, motivo: "vacia" });
    expect((await admin.from("sugerencias").select("estado").in("id", [a, b])).data!.map((s) => s.estado)).toEqual(["lista", "lista"]);
  });
});

test.describe("CA-3 y CA-7: bandeja Para revisar", () => {
  const nuevo = async (clave: string, n: string, estado: "en_cola" | "lista" = "en_cola") => {
    const p = await admin.from("productos").insert({ tipo: "vino", nombre: `${n} ${prefijo}` }).select().single();
    ids[clave] = p.data!.id;
    await admin.from("sugerencias").insert({ producto_id: p.data!.id, estado, ...(estado === "lista" ? { descripcion: `Texto sugerido ${n}`, motivo_sin_foto: "No encontré una foto oficial." } : {}) });
  };

  test("desde el menú con la cantidad; revisa y aprueba ahí mismo; ve el gasto del mes", async ({ page }) => {
    await nuevo("bandejaLista", "Bandeja Lista", "lista");
    await page.goto("/admin");
    const enlace = page.getByRole("navigation", { name: "Panel" }).getByRole("link", { name: /revisar \(\d+\)$/i });
    await enlace.click();
    await expect(page.getByRole("heading", { level: 1, name: "Para revisar" })).toBeVisible();
    await expect(page.getByText(/^Gastado este mes \(estimado\): US\$ \d+,\d{2}\.$/)).toBeVisible();
    const tarjeta = page.getByRole("article", { name: `Sugerencia para Bandeja Lista ${prefijo}` });
    await expect(tarjeta.getByRole("link", { name: `Ver la ficha de Bandeja Lista ${prefijo}` })).toBeVisible();
    await page.waitForLoadState("networkidle");
    await tarjeta.getByRole("button", { name: "Aprobar" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Listo. Ya se ve en la carta." })).toBeVisible();
    await expect(tarjeta).toHaveCount(0);
    expect((await admin.from("productos").select("descripcion").eq("id", ids.bandejaLista).single()).data!.descripcion).toBe("Texto sugerido Bandeja Lista");
  });

  test("con la bandeja abierta la cola avanza y llegan las sugerencias; las que fallan se pueden volver a pedir", async ({ page }) => {
    await nuevo("bandejaCola", "Bandeja Cola");
    await nuevo("bandejaFalla", "Bandeja [falla]");
    await page.goto("/admin/sugerencias");
    await expect(page.getByRole("article", { name: `Sugerencia para Bandeja Cola ${prefijo}` })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/^\d+ fallaron?\.$|^1 falló\.$/)).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "Volver a pedirlas" }).click();
    await expect(page.getByRole("status").filter({ hasText: /Se volvi(ó|eron) a pedir/ })).toBeVisible();
    const filas = (await admin.from("sugerencias").select("estado").eq("producto_id", ids.bandejaFalla)).data!.map((f) => f.estado);
    expect(filas).toContain("descartada");
  });

  test("con la IA apagada la cola espera y lo dice", async ({ page }) => {
    await nuevo("bandejaApagada", "Bandeja Apagada");
    await prenderIa(false);
    await page.goto("/admin/sugerencias");
    await expect(page.getByRole("status").filter({ hasText: /^Hay \d+ en cola, esperando a que se prenda la IA\.$/ })).toBeVisible();
    expect((await admin.from("sugerencias").select("estado").eq("producto_id", ids.bandejaApagada).single()).data!.estado).toBe("en_cola");
    await prenderIa(true);
  });
});

test("T11: la ficha con una sugerencia y la bandeja, en el celular: accesibles, sin scroll horizontal y tocables de 44 px", async ({ page }) => {
  const p = await admin.from("productos").insert({ tipo: "vino", nombre: `Accesible Malbec ${prefijo}` }).select().single();
  ids.accesible = p.data!.id;
  await page.goto(`/admin/productos/${ids.accesible}`);
  await page.getByRole("button", { name: "Sugerir con IA" }).click();
  await expect(sugerencia(page)).toBeVisible();
  for (const ruta of [`/admin/productos/${ids.accesible}`, "/admin/sugerencias"]) {
    await page.goto(ruta);
    await expect(page.getByRole("article").first()).toBeVisible();
    expect(await erroresGraves(page), ruta).toEqual([]);
    expect(await desborde(page), ruta).toBeLessThanOrEqual(0);
    expect(await tocablesChicos(page), ruta).toEqual([]);
  }
});
