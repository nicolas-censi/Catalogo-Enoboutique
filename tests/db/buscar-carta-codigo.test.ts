import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clienteAdmin, clienteAnon, limpiarDatos, prefijo } from "./ayudante";

afterAll(limpiarDatos);

const admin = clienteAdmin();
let contador = 0;
const ids: Record<string, string> = {};
// Códigos de 13 dígitos únicos por ejecución (el prefijo no puede ir: son solo números).
const base = String(Date.now()).slice(-9);
const codigos = { visible: `9990${base}`, oculto: `9991${base}`, agotado: `9992${base}` };

async function insertar(tabla: string, fila: Record<string, unknown>) {
  const { data, error } = await admin.from(tabla).insert(fila).select().single();
  if (error) throw error;
  return data as { id: string };
}

async function producto(clave: string, nombre: string, seccionId: string, extra = {}, enStock = true) {
  const p = await insertar("productos", { tipo: "vino", nombre: `${nombre} ${prefijo}`, seccion_id: seccionId, ...extra });
  ids[clave] = p.id;
  for (const anio of [2022, 2019]) {
    await insertar("anadas", {
      producto_id: p.id,
      codigo_tango: `${prefijo}-${++contador}`,
      descripcion_tango: nombre.toUpperCase(),
      tipo: "con_anio",
      anio,
      precio: 30000,
      en_stock: enStock,
    });
  }
}

type Fila = { producto_id: string; anio: number | null; relevancia: number };

async function buscar(texto: string, limite?: number): Promise<Fila[]> {
  const { data, error } = await clienteAnon().rpc("buscar_carta", limite ? { texto, limite } : { texto });
  if (error) throw error;
  return data;
}

beforeAll(async () => {
  const visible = await insertar("secciones", { nombre: `${prefijo} Visible`, orden: 1 });
  const oculta = await insertar("secciones", { nombre: `${prefijo} Oculta`, orden: 2, visible: false });

  await producto("pyros", "Pyros Block Quetzal Malbec", visible.id);
  await producto("oculto", "Pyros Block Quetzal Syrah", visible.id, { visible: false });
  await producto("agotado", "Pyros Block Quetzal Bonarda", visible.id, {}, false);
  await producto("enSeccionOculta", "Pyros Block Quetzal Merlot", oculta.id);

  await insertar("codigos_barras", { codigo: codigos.visible, producto_id: ids.pyros });
  await insertar("codigos_barras", { codigo: codigos.oculto, producto_id: ids.oculto });
  await insertar("codigos_barras", { codigo: codigos.agotado, producto_id: ids.agotado });
});

describe("CA-6: buscar_carta por código de barras", () => {
  it("un código completo devuelve el producto con todas sus añadas disponibles", async () => {
    const filas = await buscar(codigos.visible);
    expect(new Set(filas.map((f) => f.producto_id))).toEqual(new Set([ids.pyros]));
    expect(filas.map((f) => f.anio)).toEqual([2022, 2019]);
    expect(filas.every((f) => f.relevancia === 1)).toBe(true);
  });

  it("ignora espacios alrededor del código", async () => {
    expect(await buscar(`  ${codigos.visible} `)).toHaveLength(2);
  });

  it("un código que no existe no trae nada", async () => {
    expect(await buscar("9999999999999")).toEqual([]);
  });

  it("un número corto no se toma como código ni trae coincidencias por nombre", async () => {
    expect(await buscar(codigos.visible.slice(0, 6))).toEqual([]);
  });
});

describe("CA-8: buscar_carta nunca muestra lo no disponible", () => {
  it("no encuentra por código un producto oculto o sin stock", async () => {
    expect(await buscar(codigos.oculto)).toEqual([]);
    expect(await buscar(codigos.agotado)).toEqual([]);
  });

  it("no encuentra por nombre productos ocultos, sin stock o de secciones ocultas", async () => {
    const encontrados = new Set((await buscar("pyros block quetzal")).map((f) => f.producto_id));
    expect(encontrados.has(ids.pyros)).toBe(true);
    for (const clave of ["oculto", "agotado", "enSeccionOculta"]) {
      expect(encontrados.has(ids[clave]), clave).toBe(false);
    }
  });
});

describe("textos cortos y límite", () => {
  it.each(["", " ", "p"])("%j (menos de 2 caracteres) no trae nada", async (texto) => {
    expect(await buscar(texto)).toEqual([]);
  });

  it("respeta el límite de productos", async () => {
    const filas = await buscar("malbec", 1);
    expect(new Set(filas.map((f) => f.producto_id)).size).toBe(1);
  });
});
