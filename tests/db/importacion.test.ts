import { randomInt } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clienteAdmin, crearUsuario, limpiarDatos, limpiarUsuarios, prefijo } from "./ayudante";

// Spec 008, T6: aplicar_importacion, permisos y diccionario.
const admin = clienteAdmin();
let encargado: SupabaseClient;
let vendedor: SupabaseClient;
const importaciones: string[] = [];

afterAll(async () => {
  await admin.from("importaciones").delete().in("id", importaciones);
  await limpiarDatos();
  await limpiarUsuarios();
});

beforeAll(async () => {
  encargado = (await crearUsuario("encargado")).cliente;
  vendedor = (await crearUsuario("vendedor")).cliente;
});

const n = (nombre: string) => `${prefijo} ${nombre}`;
const cod = (sufijo: string) => `${prefijo}-${sufijo}`;
const barras = () => String(randomInt(10 ** 12, 10 ** 13 - 1));
const bodegaCodigo = `t${randomInt(10 ** 8)}`;

async function aplicar(plan: object) {
  const { data, error } = await encargado.from("importaciones").insert({ plan }).select("id").single();
  if (error) throw error;
  importaciones.push(data.id);
  return { id: data.id as string, ...(await encargado.rpc("aplicar_importacion", { importacion: data.id })) };
}

const anada = (codigo: string, extra: object = {}) => ({
  codigo,
  descripcion: "DESCRIPCION",
  tipo: "con_anio",
  anio: 2020,
  precio: 1000,
  enStock: true,
  ...extra,
});

describe("aplicar_importacion", () => {
  const codigoBarras = barras();
  let productoId = "";

  it("CA-7: crea secciones, bodegas, productos, añadas y códigos de barras", async () => {
    const r = await aplicar({
      seccionesNuevas: [n("Tintos importados")],
      bodegasNuevas: [{ codigo: bodegaCodigo, nombre: n("Rutini importada"), existenteId: null }],
      productosNuevos: [
        {
          tipo: "vino",
          nombre: n("Rutini Malbec importado"),
          varietal: "Malbec",
          bodegaCodigo,
          seccion: n("Tintos importados"),
          visible: true,
          codigosBarras: [codigoBarras],
          anadas: [anada(cod("a1")), anada(cod("a2"), { anio: 2021, precio: null })],
        },
      ],
      anadasNuevas: [],
      codigosBarrasNuevos: [],
      precios: [],
    });
    expect(r.error).toBeNull();
    const { data } = await admin
      .from("productos")
      .select("id, nombre, varietal, visible, bodegas(nombre, codigo_tango), secciones(nombre), anadas(codigo_tango, anio, precio, en_stock), codigos_barras(codigo)")
      .eq("nombre", n("Rutini Malbec importado"))
      .single();
    productoId = data!.id;
    expect(data).toMatchObject({
      varietal: "Malbec",
      visible: true,
      bodegas: { nombre: n("Rutini importada"), codigo_tango: bodegaCodigo },
      secciones: { nombre: n("Tintos importados") },
      codigos_barras: [{ codigo: codigoBarras }],
    });
    expect(data!.anadas).toHaveLength(2);
    expect((await admin.from("importaciones").select("estado").eq("id", r.id).single()).data!.estado).toBe("aplicada");
  });

  it("CA-8: actualiza precios y suma añadas a un producto existente, sin stock", async () => {
    const r = await aplicar({
      seccionesNuevas: [n("Tintos importados")], // ya existe: no se duplica
      bodegasNuevas: [],
      productosNuevos: [],
      anadasNuevas: [{ productoId, ...anada(cod("a3"), { anio: 2022, enStock: false }) }],
      codigosBarrasNuevos: [],
      precios: [{ codigo: cod("a1"), anterior: 1000, nuevo: 1500.5 }],
    });
    expect(r.error).toBeNull();
    const anadas = (await admin.from("anadas").select("codigo_tango, precio, en_stock").eq("producto_id", productoId).order("codigo_tango")).data;
    expect(anadas).toEqual([
      { codigo_tango: cod("a1"), precio: 1500.5, en_stock: true },
      { codigo_tango: cod("a2"), precio: null, en_stock: true },
      { codigo_tango: cod("a3"), precio: 1000, en_stock: false },
    ]);
    expect((await admin.from("secciones").select("id").eq("nombre", n("Tintos importados"))).data).toHaveLength(1);
  });

  it("CA-1: si algo falla no se aplica nada, y avisa que la carta cambió", async () => {
    const r = await aplicar({
      seccionesNuevas: [n("No debería existir")],
      bodegasNuevas: [],
      productosNuevos: [
        { tipo: "vino", nombre: n("Tampoco"), varietal: null, bodegaCodigo: null, seccion: null, visible: true, codigosBarras: [], anadas: [anada(cod("a1"))] },
      ],
      anadasNuevas: [],
      codigosBarrasNuevos: [],
      precios: [],
    });
    expect(r.error?.message).toBe("La carta cambió desde que subiste el archivo. Volvé a subirlo para ver el resumen actualizado.");
    expect((await admin.from("secciones").select("id").eq("nombre", n("No debería existir"))).data).toEqual([]);
    expect((await admin.from("productos").select("id").eq("nombre", n("Tampoco"))).data).toEqual([]);
  });

  it("CA-11: usa la sección elegida (también una subsección) en vez de la sugerida", async () => {
    const padre = (await admin.from("secciones").insert({ nombre: n("Cava elegida"), orden: 99000 }).select().single()).data!.id;
    const sub = (await admin.from("secciones").insert({ nombre: n("Joyitas elegida"), orden: 1, seccion_padre_id: padre }).select().single()).data!.id;
    const r = await aplicar({
      seccionesNuevas: [],
      bodegasNuevas: [],
      productosNuevos: [
        { tipo: "vino", nombre: n("Elegido"), varietal: null, bodegaCodigo: null, seccion: n("Tintos importados"), seccionId: sub, visible: true, codigosBarras: [], anadas: [anada(cod("e1"))] },
      ],
      anadasNuevas: [],
      codigosBarrasNuevos: [],
      precios: [],
    });
    expect(r.error).toBeNull();
    expect((await admin.from("productos").select("seccion_id").eq("nombre", n("Elegido")).single()).data!.seccion_id).toBe(sub);
  });

  it("no se aplica dos veces", async () => {
    const r = await aplicar({ seccionesNuevas: [], bodegasNuevas: [], productosNuevos: [], anadasNuevas: [], codigosBarrasNuevos: [], precios: [] });
    expect(r.error).toBeNull();
    const otra = await encargado.rpc("aplicar_importacion", { importacion: r.id });
    expect(otra.error?.message).toBe("Esta importación ya se aplicó o no existe. Volvé a subir el archivo.");
  });

  it("solo el encargado importa", async () => {
    expect((await vendedor.from("importaciones").insert({ plan: {} })).error?.code).toBe("42501");
    expect((await vendedor.rpc("aplicar_importacion", { importacion: importaciones[0] })).error?.code).toBe("42501");
  });
});

describe("abreviaturas (CA-4)", () => {
  it("el personal las lee; solo el encargado las cambia", async () => {
    const { data } = await vendedor.from("abreviaturas").select("abreviatura, expansion").eq("abreviatura", "MAL").single();
    expect(data).toEqual({ abreviatura: "MAL", expansion: "Malbec" });
    expect((await vendedor.from("abreviaturas").insert({ abreviatura: "ZZPRUEBA", expansion: "X" })).error?.code).toBe("42501");
    const alta = await encargado.from("abreviaturas").insert({ abreviatura: "ZZPRUEBA", expansion: "Prueba" });
    expect(alta.error).toBeNull();
    await encargado.from("abreviaturas").delete().eq("abreviatura", "ZZPRUEBA");
  });
});
