import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clienteAdmin, clienteAnon, limpiarDatos, prefijo } from "./ayudante";

// Spec 005, T1: destacados (productos.orden opcional) y datos para el orden automático.
afterAll(limpiarDatos);

const admin = clienteAdmin();
let contador = 0;

async function insertar(tabla: string, fila: Record<string, unknown>) {
  const { data, error } = await admin.from(tabla).insert(fila).select().single();
  if (error) throw error;
  return data as { id: string; orden: number | null };
}

const anada = (productoId: string, precio: number | null, en_stock = true) =>
  insertar("anadas", {
    producto_id: productoId,
    codigo_tango: `${prefijo}-orden-${++contador}`,
    descripcion_tango: "DESCRIPCION TANGO",
    tipo: "con_anio",
    anio: 2000 + contador,
    precio,
    en_stock,
  });

const ordenDe = async (id: string) => (await admin.from("productos").select("orden").eq("id", id).single()).data!.orden;

let seccion: { id: string };
let otraSeccion: { id: string };

beforeAll(async () => {
  seccion = await insertar("secciones", { nombre: `${prefijo} Orden`, orden: 900 });
  otraSeccion = await insertar("secciones", { nombre: `${prefijo} Orden 2`, orden: 901 });
});

describe("CA-3: destacados", () => {
  it("un producto nuevo no es destacado", async () => {
    const p = await insertar("productos", { tipo: "vino", nombre: `${prefijo} Nuevo`, seccion_id: seccion.id });
    expect(p.orden).toBeNull();
  });

  it("al pasar a otra sección deja de ser destacado; otros cambios lo conservan", async () => {
    const p = await insertar("productos", { tipo: "vino", nombre: `${prefijo} Destacado`, seccion_id: seccion.id, orden: 1 });
    await admin.from("productos").update({ nombre: `${prefijo} Destacado editado` }).eq("id", p.id);
    expect(await ordenDe(p.id)).toBe(1);
    await admin.from("productos").update({ seccion_id: otraSeccion.id }).eq("id", p.id);
    expect(await ordenDe(p.id)).toBeNull();
  });
});

describe("CA-2: datos para el orden automático en carta_publica", () => {
  it("trae el precio más barato entre las añadas disponibles y la bodega normalizada", async () => {
    const bodega = await insertar("bodegas", { nombre: `${prefijo} ÁLAMOS` });
    const p = await insertar("productos", { tipo: "vino", nombre: `${prefijo} Con añadas`, seccion_id: seccion.id, bodega_id: bodega.id });
    await anada(p.id, 50000);
    await anada(p.id, 30000);
    await anada(p.id, 10000, false); // sin stock: no cuenta
    const { data, error } = await clienteAnon()
      .from("carta_publica")
      .select("producto_precio_min, bodega_orden")
      .eq("producto_id", p.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    for (const fila of data!) {
      expect(Number(fila.producto_precio_min)).toBe(30000);
      expect(fila.bodega_orden).toBe(`${prefijo} alamos`);
    }
  });

  it("sin bodega, bodega_orden es null", async () => {
    const p = await insertar("productos", { tipo: "vino", nombre: `${prefijo} Sin bodega`, seccion_id: seccion.id });
    await anada(p.id, 5000);
    const { data } = await clienteAnon().from("carta_publica").select("bodega_orden").eq("producto_id", p.id);
    expect(data).toEqual([{ bodega_orden: null }]);
  });
});
