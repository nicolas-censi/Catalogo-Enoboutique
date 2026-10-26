import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clienteAdmin, clienteAnon, crearUsuario, limpiarDatos, limpiarUsuarios, prefijo } from "./ayudante";

afterAll(async () => {
  await limpiarDatos();
  await limpiarUsuarios();
});

const admin = clienteAdmin();
let contador = 0;

async function insertar<T = { id: string }>(tabla: string, fila: Record<string, unknown>) {
  const { data, error } = await admin.from(tabla).insert(fila).select().single();
  if (error) throw error;
  return data as T & { id: string };
}

function anada(productoId: string, campos: Record<string, unknown>) {
  return insertar("anadas", {
    producto_id: productoId,
    codigo_tango: `${prefijo}-${++contador}`,
    descripcion_tango: "DESCRIPCION TANGO",
    tipo: "con_anio",
    precio: 10000,
    en_stock: true,
    ...campos,
  });
}

/** Carta pública de esta ejecución, en el orden en que se muestra. */
async function leerCarta(cliente = clienteAnon()) {
  const { data, error } = await cliente
    .from("carta_publica")
    .select("*")
    .like("seccion_nombre", `${prefijo}%`)
    .order("seccion_orden")
    .order("producto_orden")
    .order("anio", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data;
}

const ids: Record<string, string> = {};

beforeAll(async () => {
  const cava = await insertar("secciones", { nombre: `${prefijo} Cava`, orden: 2 });
  const tintos = await insertar("secciones", { nombre: `${prefijo} Tintos`, orden: 1 });
  const oculta = await insertar("secciones", { nombre: `${prefijo} Oculta`, orden: 3, visible: false });
  const bodega = await insertar("bodegas", { nombre: `${prefijo} Rutini` });

  const producto = (nombre: string, seccion: string, orden: number, extra = {}) =>
    insertar("productos", {
      tipo: "vino",
      nombre: `${prefijo} ${nombre}`,
      seccion_id: seccion,
      orden,
      ...extra,
    });

  const rutini = await producto("Rutini Malbec", cava.id, 1, {
    bodega_id: bodega.id,
    varietal: "Malbec",
    descripcion: "Malbec de Gualtallary.",
  });
  ids.rutini = rutini.id;
  await anada(rutini.id, { anio: 2018, precio: 54000 });
  await anada(rutini.id, { anio: 2021, precio: 43000 });
  await anada(rutini.id, { anio: 2020, precio: 47000 });
  await anada(rutini.id, { anio: 2017, precio: 58000, en_stock: false });
  await anada(rutini.id, { anio: 2019, precio: null });

  const agotado = await producto("Vino agotado", tintos.id, 1);
  ids.agotado = agotado.id;
  await anada(agotado.id, { anio: 2020, en_stock: false });

  const oculto = await producto("Vino oculto", tintos.id, 2, { visible: false });
  ids.oculto = oculto.id;
  await anada(oculto.id, { anio: 2020 });

  const enSeccionOculta = await producto("En sección oculta", oculta.id, 1);
  ids.enSeccionOculta = enSeccionOculta.id;
  await anada(enSeccionOculta.id, { anio: 2020 });

  const sinSeccion = await insertar("productos", { tipo: "vino", nombre: `${prefijo} Sin sección` });
  ids.sinSeccion = sinSeccion.id;
  await anada(sinSeccion.id, { anio: 2020 });

  const malbecJoven = await producto("Malbec joven", tintos.id, 3);
  ids.malbecJoven = malbecJoven.id;
  await anada(malbecJoven.id, { anio: 2023 });

  const whisky = await insertar("productos", {
    tipo: "destilado",
    nombre: `${prefijo} Glenmorangie Original`,
    seccion_id: tintos.id,
    orden: 4,
  });
  ids.whisky = whisky.id;
  await anada(whisky.id, { tipo: "sin_anada", anio: null, precio: 98000 });
});

describe("carta pública", () => {
  it("CA-3: un vino aparece una sola vez con sus añadas, de la más nueva a la más vieja", async () => {
    const filas = (await leerCarta()).filter((f) => f.producto_id === ids.rutini);
    expect(filas.map((f) => [f.anio, f.precio])).toEqual([
      [2021, 43000],
      [2020, 47000],
      [2019, null],
      [2018, 54000],
    ]);
    expect(new Set(filas.map((f) => f.producto_nombre))).toEqual(new Set([`${prefijo} Rutini Malbec`]));
    expect(filas[0]).toMatchObject({
      producto_tipo: "vino",
      bodega_nombre: `${prefijo} Rutini`,
      varietal: "Malbec",
      descripcion: "Malbec de Gualtallary.",
      seccion_nombre: `${prefijo} Cava`,
    });
  });

  it("CA-8: esconde las añadas sin stock", async () => {
    const anios = (await leerCarta()).filter((f) => f.producto_id === ids.rutini).map((f) => f.anio);
    expect(anios).not.toContain(2017);
  });

  it("CA-8: muestra las añadas sin precio, con precio vacío", async () => {
    const fila = (await leerCarta()).find((f) => f.producto_id === ids.rutini && f.anio === 2019);
    expect(fila?.precio).toBeNull();
  });

  it("CA-8: esconde productos sin stock, ocultos, en secciones ocultas o sin sección", async () => {
    const visibles = new Set((await leerCarta()).map((f) => f.producto_id));
    for (const id of [ids.agotado, ids.oculto, ids.enSeccionOculta, ids.sinSeccion]) {
      expect(visibles.has(id)).toBe(false);
    }
    const { data } = await clienteAnon().from("carta_publica").select("producto_id").eq("producto_id", ids.sinSeccion);
    expect(data).toEqual([]);
  });

  it("CA-6: los productos que no son vino aparecen con un único precio y sin año", async () => {
    const filas = (await leerCarta()).filter((f) => f.producto_id === ids.whisky);
    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({ producto_tipo: "destilado", anio: null, anada_tipo: "sin_anada", precio: 98000 });
  });

  it("CA-9: respeta el orden de las secciones y de los productos dentro de cada una", async () => {
    const carta = await leerCarta();
    const orden = [...new Set(carta.map((f) => `${f.seccion_nombre} / ${f.producto_nombre}`))];
    expect(orden).toEqual([
      `${prefijo} Tintos / ${prefijo} Malbec joven`,
      `${prefijo} Tintos / ${prefijo} Glenmorangie Original`,
      `${prefijo} Cava / ${prefijo} Rutini Malbec`,
    ]);
  });

  it("CA-9: refleja al instante un cambio de nombre u orden de sección", async () => {
    const cava = (await admin.from("secciones").select("id").eq("nombre", `${prefijo} Cava`).single()).data!;
    await admin.from("secciones").update({ nombre: `${prefijo} Cava privada`, orden: 0 }).eq("id", cava.id);
    const secciones = [...new Set((await leerCarta()).map((f) => f.seccion_nombre))];
    expect(secciones).toEqual([`${prefijo} Cava privada`, `${prefijo} Tintos`]);
  });

  it("CA-8: no expone datos internos ni cantidades de stock", async () => {
    const [fila] = await leerCarta();
    for (const campo of ["codigo_tango", "descripcion_tango", "en_stock", "creado_en", "actualizado_en"]) {
      expect(fila).not.toHaveProperty(campo);
    }
  });

  it("la puede leer cualquier usuario con sesión, aunque no sea del personal", async () => {
    const { cliente } = await crearUsuario();
    expect((await leerCarta(cliente)).length).toBeGreaterThan(0);
  });

  it("es de solo lectura para el público", async () => {
    const { error } = await clienteAnon()
      .from("carta_publica")
      .update({ precio: 1 })
      .eq("producto_id", ids.rutini);
    expect(error).not.toBeNull();
    const { data } = await admin.from("anadas").select("precio").eq("producto_id", ids.rutini).eq("precio", 1);
    expect(data).toEqual([]);
  });
});
