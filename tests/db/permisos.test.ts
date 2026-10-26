import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  clienteAdmin,
  clienteAnon,
  crearUsuario,
  limpiarDatos,
  limpiarUsuarios,
  prefijo,
  type Rol,
} from "./ayudante";

afterAll(async () => {
  await limpiarDatos();
  await limpiarUsuarios();
});

const admin = clienteAdmin();
let contador = 0;
const nombre = (texto: string) => `${prefijo} ${texto} ${++contador}`;

/** Datos de referencia creados con la clave secreta, para probar la lectura. */
async function crearDatosDeReferencia() {
  const seccion = (
    await admin.from("secciones").insert({ nombre: nombre("Tintos"), orden: 1 }).select().single()
  ).data!;
  const producto = (
    await admin
      .from("productos")
      .insert({ tipo: "vino", nombre: nombre("Rutini Malbec"), seccion_id: seccion.id })
      .select()
      .single()
  ).data!;
  await admin.from("anadas").insert({
    producto_id: producto.id,
    codigo_tango: `${prefijo}-${++contador}`,
    descripcion_tango: "RUTINI MAL 2020",
    tipo: "con_anio",
    anio: 2020,
    precio: 47000,
    en_stock: true,
  });
  await admin
    .from("codigos_barras")
    .insert({ codigo: `${prefijo}-${++contador}`, producto_id: producto.id });
  return { seccion, producto };
}

describe.each<Rol>(["encargado", "vendedor"])("CA-10: personal con rol %s", (rol) => {
  let cliente: SupabaseClient;
  beforeAll(async () => {
    ({ cliente } = await crearUsuario(rol));
  });

  it("lee todas las tablas, incluso datos internos y no publicados", async () => {
    const { producto } = await crearDatosDeReferencia();
    await admin.from("productos").update({ visible: false }).eq("id", producto.id);

    const productos = await cliente.from("productos").select("id").eq("id", producto.id);
    expect(productos.data).toHaveLength(1);
    const anadas = await cliente.from("anadas").select("codigo_tango").eq("producto_id", producto.id);
    expect(anadas.data).toHaveLength(1);
    const codigos = await cliente.from("codigos_barras").select("codigo").eq("producto_id", producto.id);
    expect(codigos.data).toHaveLength(1);
  });

  it("crea, modifica y borra secciones, bodegas, productos, añadas y códigos", async () => {
    const seccion = await cliente
      .from("secciones")
      .insert({ nombre: nombre("Blancos"), orden: 2 })
      .select()
      .single();
    expect(seccion.error).toBeNull();
    const bodega = await cliente.from("bodegas").insert({ nombre: nombre("Zuccardi") }).select().single();
    expect(bodega.error).toBeNull();
    const vino = await cliente
      .from("productos")
      .insert({
        tipo: "vino",
        nombre: nombre("Zuccardi Q Malbec"),
        bodega_id: bodega.data!.id,
        seccion_id: seccion.data!.id,
      })
      .select()
      .single();
    expect(vino.error).toBeNull();

    const anadas = await cliente.from("anadas").insert([
      {
        producto_id: vino.data!.id,
        codigo_tango: `${prefijo}-${++contador}`,
        descripcion_tango: "ZUCCARDI Q MAL 2020",
        tipo: "con_anio",
        anio: 2020,
        precio: 28700,
      },
      {
        producto_id: vino.data!.id,
        codigo_tango: `${prefijo}-${++contador}`,
        descripcion_tango: "ZUCCARDI Q MAL",
        tipo: "sin_especificar",
        anio: null,
        precio: 20500,
      },
    ]);
    expect(anadas.error).toBeNull();
    const codigo = await cliente
      .from("codigos_barras")
      .insert({ codigo: `${prefijo}-${++contador}`, producto_id: vino.data!.id });
    expect(codigo.error).toBeNull();

    const cambio = await cliente
      .from("anadas")
      .update({ precio: 30000, en_stock: true })
      .eq("producto_id", vino.data!.id)
      .eq("anio", 2020)
      .select("precio, en_stock")
      .single();
    expect(cambio.data).toEqual({ precio: 30000, en_stock: true });

    const borrado = await cliente.from("productos").delete().eq("id", vino.data!.id).select("id");
    expect(borrado.data).toHaveLength(1);
  });

  it("carga la presentación única de un aceite, con la regla de T8 activa", async () => {
    const aceite = await cliente
      .from("productos")
      .insert({ tipo: "aceite", nombre: nombre("AOVE Zuccardi Picual") })
      .select()
      .single();
    const presentacion = (n: number) => ({
      producto_id: aceite.data!.id,
      codigo_tango: `${prefijo}-${++contador}-${n}`,
      descripcion_tango: "AOVE ZUCCARDI PICUAL 500CC",
      tipo: "sin_anada",
      anio: null,
      precio: 15000,
    });
    expect((await cliente.from("anadas").insert(presentacion(1))).error).toBeNull();
    expect((await cliente.from("anadas").insert(presentacion(2))).error?.code).toBe("23514");
  });

  it("puede leer la tabla de personal, pero no darse de alta ni cambiar roles", async () => {
    const lectura = await cliente.from("personal").select("rol");
    expect(lectura.error).toBeNull();
    expect(lectura.data!.length).toBeGreaterThan(0);

    const { usuario: otro } = await crearUsuario();
    const alta = await cliente.from("personal").insert({ user_id: otro.id, rol: "encargado" });
    expect(alta.error?.code).toBe("42501");
  });
});

describe.each([
  ["un visitante sin sesión", async () => clienteAnon()],
  ["un usuario con sesión que no es del personal", async () => (await crearUsuario()).cliente],
])("CA-10: %s", (_quien, obtenerCliente) => {
  let cliente: SupabaseClient;
  beforeAll(async () => {
    cliente = await obtenerCliente();
  });

  it("no puede leer ninguna tabla", async () => {
    const { producto } = await crearDatosDeReferencia();
    for (const [tabla, columna] of [
      ["secciones", "nombre"],
      ["productos", "id"],
      ["anadas", "producto_id"],
      ["codigos_barras", "producto_id"],
    ] as const) {
      const valor = columna === "nombre" ? `${prefijo}%` : producto.id;
      const consulta =
        columna === "nombre"
          ? cliente.from(tabla).select("*").like(columna, valor)
          : cliente.from(tabla).select("*").eq(columna, valor);
      const { data } = await consulta;
      expect(data ?? [], tabla).toEqual([]);
    }
    const { data } = await cliente.from("personal").select("*");
    expect(data ?? []).toEqual([]);
  });

  it("no puede crear datos", async () => {
    const { error } = await cliente.from("secciones").insert({ nombre: nombre("Intrusa"), orden: 1 });
    expect(error?.code).toBe("42501");
  });

  it("no puede modificar ni borrar datos", async () => {
    const { seccion, producto } = await crearDatosDeReferencia();
    await cliente.from("secciones").update({ nombre: "hackeada" }).eq("id", seccion.id);
    await cliente.from("productos").delete().eq("id", producto.id);

    const despues = await admin.from("secciones").select("nombre").eq("id", seccion.id).single();
    expect(despues.data!.nombre).toBe(seccion.nombre);
    const sigue = await admin.from("productos").select("id").eq("id", producto.id);
    expect(sigue.data).toHaveLength(1);
  });

  it("no puede darse de alta como personal", async () => {
    const { error } = await cliente
      .from("personal")
      .insert({ user_id: "00000000-0000-0000-0000-000000000000", rol: "encargado" });
    expect(error?.code).toBe("42501");
  });
});
