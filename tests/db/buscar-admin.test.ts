import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clienteAdmin, clienteAnon, crearUsuario, limpiarDatos, limpiarUsuarios, prefijo } from "./ayudante";

afterAll(async () => {
  await limpiarDatos();
  await limpiarUsuarios();
});

const admin = clienteAdmin();
const ids: Record<string, string> = {};
let personal: SupabaseClient;
const codigoBarras = `9993${String(Date.now()).slice(-9)}`;

async function insertar(tabla: string, fila: Record<string, unknown>) {
  const { data, error } = await admin.from(tabla).insert(fila).select().single();
  if (error) throw error;
  return data as { id: string };
}

type Fila = { producto_id: string };
const buscar = async (cliente: SupabaseClient, texto: string): Promise<string[]> => {
  const { data, error } = await cliente.rpc("buscar_admin", { texto });
  if (error) throw error;
  return (data as Fila[]).map((f) => f.producto_id);
};

beforeAll(async () => {
  ({ cliente: personal } = await crearUsuario("vendedor"));
  const bodega = await insertar("bodegas", { nombre: `Quetzaltenango ${prefijo}` });
  // Oculto, sin sección y sin stock: la carta no lo muestra, el panel sí.
  const oculto = await insertar("productos", {
    tipo: "vino",
    nombre: `Mirasol Reserva Malbec ${prefijo}`,
    bodega_id: bodega.id,
    visible: false,
  });
  ids.oculto = oculto.id;
  await insertar("anadas", {
    producto_id: oculto.id,
    codigo_tango: `${prefijo}-VImir0001`,
    descripcion_tango: "MIRASOL RVA MAL 2019",
    tipo: "con_anio",
    anio: 2019,
    en_stock: false,
  });
  await insertar("codigos_barras", { codigo: codigoBarras, producto_id: oculto.id });
  ids.sinAnadas = (await insertar("productos", { tipo: "aceite", nombre: `Oliva Quetzal ${prefijo}` })).id;
});

describe("CA-2: buscar_admin", () => {
  it("encuentra productos ocultos, sin stock y sin sección, con errores de tipeo", async () => {
    expect(await buscar(personal, "mirasol reserva")).toContain(ids.oculto);
    expect(await buscar(personal, "mirasl")).toContain(ids.oculto);
  });

  it("busca por bodega", async () => {
    expect(await buscar(personal, "quetzaltenango")).toContain(ids.oculto);
  });

  it("busca por código de Tango exacto, sin importar mayúsculas", async () => {
    expect(await buscar(personal, `${prefijo}-vimir0001`.toUpperCase())).toEqual([ids.oculto]);
  });

  it("busca por código de barras exacto", async () => {
    expect(await buscar(personal, codigoBarras)).toEqual([ids.oculto]);
  });

  it("encuentra productos sin añadas", async () => {
    expect(await buscar(personal, "oliva quetzal")).toContain(ids.sinAnadas);
  });

  it("devuelve cada producto una sola vez", async () => {
    const resultado = await buscar(personal, "mirasol");
    expect(resultado.filter((id) => id === ids.oculto)).toHaveLength(1);
  });

  it("un visitante o alguien que no es del personal no encuentra nada", async () => {
    const { cliente: noPersonal } = await crearUsuario();
    expect(await buscar(noPersonal, "mirasol reserva")).toEqual([]);
    const anon = await clienteAnon().rpc("buscar_admin", { texto: "mirasol reserva" });
    expect(anon.data ?? []).toEqual([]);
  });
});
