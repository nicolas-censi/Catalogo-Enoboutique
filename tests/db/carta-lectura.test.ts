import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { leerProducto, leerSeccion, leerSecciones } from "@/lib/carta";
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

async function anada(productoId: string, anio: number | null, campos: Record<string, unknown> = {}) {
  await insertar("anadas", {
    producto_id: productoId,
    codigo_tango: `${prefijo}-${++contador}`,
    descripcion_tango: "TANGO",
    tipo: anio === null ? "sin_anada" : "con_anio",
    anio,
    precio: 20000,
    en_stock: true,
    ...campos,
  });
}

beforeAll(async () => {
  const tintos = await insertar("secciones", { nombre: `${prefijo} Tintos`, orden: 2 });
  const cava = await insertar("secciones", { nombre: `${prefijo} Cava`, orden: 1 });
  const vacia = await insertar("secciones", { nombre: `${prefijo} Vacía`, orden: 3 });
  const oculta = await insertar("secciones", { nombre: `${prefijo} Oculta`, orden: 4, visible: false });
  Object.assign(ids, { tintos: tintos.id, cava: cava.id, vacia: vacia.id, oculta: oculta.id });

  const segundo = await insertar("productos", { tipo: "vino", nombre: `${prefijo} Segundo`, seccion_id: tintos.id, orden: 2 });
  const primero = await insertar("productos", { tipo: "vino", nombre: `${prefijo} Primero`, seccion_id: tintos.id, orden: 1 });
  const agotado = await insertar("productos", { tipo: "vino", nombre: `${prefijo} Agotado`, seccion_id: vacia.id });
  const enOculta = await insertar("productos", { tipo: "vino", nombre: `${prefijo} En oculta`, seccion_id: oculta.id });
  const whisky = await insertar("productos", { tipo: "destilado", nombre: `${prefijo} Whisky`, seccion_id: cava.id });
  Object.assign(ids, { segundo: segundo.id, primero: primero.id, agotado: agotado.id, enOculta: enOculta.id, whisky: whisky.id });

  await anada(segundo.id, 2020);
  await anada(primero.id, 2019);
  await anada(primero.id, 2022, { precio: 31000 });
  await anada(agotado.id, 2020, { en_stock: false });
  await anada(enOculta.id, 2020);
  await anada(whisky.id, null, { precio: 98000 });
});

describe("leerSecciones (CA-1)", () => {
  it("devuelve las secciones visibles con productos disponibles, en orden", async () => {
    const secciones = (await leerSecciones(clienteAnon())).filter((s) => s.nombre.startsWith(prefijo));
    expect(secciones).toEqual([
      { id: ids.cava, nombre: `${prefijo} Cava` },
      { id: ids.tintos, nombre: `${prefijo} Tintos` },
    ]);
  });
});

describe("leerSeccion (CA-2)", () => {
  it("devuelve la sección con sus productos en orden y sus añadas", async () => {
    const seccion = await leerSeccion(clienteAnon(), ids.tintos);
    expect(seccion?.nombre).toBe(`${prefijo} Tintos`);
    expect(seccion?.productos.map((p) => p.nombre)).toEqual([`${prefijo} Primero`, `${prefijo} Segundo`]);
    expect(seccion?.productos[0].anadas.map((a) => [a.etiqueta, a.precio])).toEqual([
      ["2022", 31000],
      ["2019", 20000],
    ]);
  });

  it.each(["vacia", "oculta"])("devuelve null para una sección %s", async (clave) => {
    expect(await leerSeccion(clienteAnon(), ids[clave])).toBeNull();
  });

  it("devuelve null para un id que no es un uuid", async () => {
    expect(await leerSeccion(clienteAnon(), "cualquier-cosa")).toBeNull();
  });
});

describe("leerProducto (CA-3, CA-8)", () => {
  it("devuelve el producto con sus añadas", async () => {
    const whisky = await leerProducto(clienteAnon(), ids.whisky);
    expect(whisky).toMatchObject({
      nombre: `${prefijo} Whisky`,
      tipo: "destilado",
      seccion: { id: ids.cava, nombre: `${prefijo} Cava` },
      anadas: [{ etiqueta: null, precio: 98000 }],
    });
  });

  it.each(["agotado", "enOculta"])("devuelve null para un producto no disponible (%s)", async (clave) => {
    expect(await leerProducto(clienteAnon(), ids[clave])).toBeNull();
  });

  it("devuelve null para un id que no es un uuid", async () => {
    expect(await leerProducto(clienteAnon(), "no-existe")).toBeNull();
  });
});
