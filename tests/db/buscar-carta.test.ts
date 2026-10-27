import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clienteAdmin, clienteAnon, limpiarDatos, prefijo } from "./ayudante";

afterAll(limpiarDatos);

const admin = clienteAdmin();
let contador = 0;
const ids: Record<string, string> = {};

async function insertar(tabla: string, fila: Record<string, unknown>) {
  const { data, error } = await admin.from(tabla).insert(fila).select().single();
  if (error) throw error;
  return data as { id: string };
}

/** Producto disponible. El prefijo va al final para no afectar la similitud. */
async function producto(
  clave: string,
  nombre: string,
  seccionId: string,
  extra: Record<string, unknown> = {},
  anios = [2020],
) {
  const p = await insertar("productos", {
    tipo: "vino",
    nombre: `${nombre} ${prefijo}`,
    seccion_id: seccionId,
    ...extra,
  });
  ids[clave] = p.id;
  for (const anio of anios) {
    await insertar("anadas", {
      producto_id: p.id,
      codigo_tango: `${prefijo}-${++contador}`,
      descripcion_tango: nombre.toUpperCase(),
      tipo: "con_anio",
      anio,
      precio: 30000,
      en_stock: true,
    });
  }
}

type Fila = { producto_id: string; anio: number | null; relevancia: number };

async function buscar(texto: string): Promise<Fila[]> {
  const { data, error } = await clienteAnon().rpc("buscar_carta", { texto });
  if (error) throw error;
  return data;
}

/** Ids de los productos de esta ejecución, en el orden de los resultados. */
const encontrados = (filas: Fila[]) => {
  const propios = new Set(Object.values(ids));
  return [...new Set(filas.map((f) => f.producto_id))].filter((id) => propios.has(id));
};

beforeAll(async () => {
  const seccion = await insertar("secciones", { nombre: `${prefijo} Tintos`, orden: 1 });
  const zuccardi = await insertar("bodegas", { nombre: `Zuccardi ${prefijo}` });
  const salentein = await insertar("bodegas", { nombre: `Salentein ${prefijo}` });
  await producto("rutini", "Rutini Malbec", seccion.id, { varietal: "Malbec" }, [2021, 2018]);
  await producto("zuccardiQ", "Zuccardi Q Malbec", seccion.id, { bodega_id: zuccardi.id, varietal: "Malbec" });
  await producto("primus", "Salentein Primus Pinot Noir", seccion.id, {
    bodega_id: salentein.id,
    varietal: "Pinot Noir",
  });
  await producto("killka", "Killka Chardonnay", seccion.id, {
    bodega_id: salentein.id,
    varietal: "Chardonnay",
  });
  await producto("costa", "Costa & Pampa Sauvignon Blanc", seccion.id, { varietal: "Sauvignon Blanc" });
});

describe("CA-5: buscar_carta tolera errores", () => {
  it.each([
    ["rutni", "rutini"],
    ["RUTINI", "rutini"],
    ["zucardi", "zuccardiQ"],
    ["salentéin primus", "primus"],
    ["primus", "primus"],
    ["sauvignon", "costa"],
    ["sauvignon blanc", "costa"],
    ["chardonay", "killka"],
  ])("%j encuentra el producto esperado", async (texto, clave) => {
    expect(encontrados(await buscar(texto))).toContain(ids[clave]);
  });

  it("busca por bodega: 'salentein' trae todos sus productos", async () => {
    const resultado = encontrados(await buscar("salentein"));
    expect(resultado).toEqual(expect.arrayContaining([ids.primus, ids.killka]));
  });

  it("busca por varietal: 'malbec' trae los Malbec y no el Chardonnay", async () => {
    const resultado = encontrados(await buscar("malbec"));
    expect(resultado).toEqual(expect.arrayContaining([ids.rutini, ids.zuccardiQ]));
    expect(resultado).not.toContain(ids.killka);
  });

  it("ordena por relevancia: lo más parecido primero", async () => {
    const filas = await buscar("salentein primus");
    expect(encontrados(filas)[0]).toBe(ids.primus);
    const relevancias = filas.map((f) => f.relevancia);
    expect(relevancias).toEqual([...relevancias].sort((a, b) => b - a));
  });

  it("devuelve todas las añadas disponibles del producto, de la más nueva a la más vieja", async () => {
    const filas = (await buscar("rutini")).filter((f) => f.producto_id === ids.rutini);
    expect(filas.map((f) => f.anio)).toEqual([2021, 2018]);
  });

  it("no encuentra cualquier cosa: un texto sin relación no trae productos", async () => {
    expect(encontrados(await buscar("heladera"))).toEqual([]);
  });
});
