import { afterAll, describe, expect, it } from "vitest";
import { clienteAdmin, clienteAnon, limpiarDatos, prefijo } from "./ayudante";

afterAll(limpiarDatos);

const admin = clienteAdmin();
let contador = 0;

async function crearVino(nombre = "Rutini Malbec") {
  const { data, error } = await admin
    .from("productos")
    .insert({ tipo: "vino", nombre: `${prefijo} ${nombre} ${++contador}` })
    .select()
    .single();
  if (error) throw error;
  return data;
}

function anada(productoId: string, campos: Record<string, unknown> = {}) {
  return {
    producto_id: productoId,
    codigo_tango: `${prefijo}-${++contador}`,
    descripcion_tango: "RUTINI MAL 2020",
    tipo: "con_anio",
    anio: 2020,
    precio: 47000,
    ...campos,
  };
}

describe("añadas", () => {
  it("guarda una añada con su código de Tango, precio y stock", async () => {
    const vino = await crearVino();
    const { data, error } = await admin
      .from("anadas")
      .insert(anada(vino.id))
      .select("tipo, anio, precio, en_stock")
      .single();
    expect(error).toBeNull();
    // Sin stock hasta que se indique lo contrario.
    expect(data).toEqual({ tipo: "con_anio", anio: 2020, precio: 47000, en_stock: false });
  });

  it("CA-4: no admite dos añadas con el mismo código de Tango", async () => {
    const vino = await crearVino();
    const otro = await crearVino("Otro vino");
    const codigo = `${prefijo}-VIrut0015`;
    await admin.from("anadas").insert(anada(vino.id, { codigo_tango: codigo, anio: 2020 }));
    const { error } = await admin
      .from("anadas")
      .insert(anada(otro.id, { codigo_tango: codigo, anio: 2018 }));
    expect(error?.code).toBe("23505");
  });

  it("CA-7: no admite dos añadas del mismo año en el mismo vino", async () => {
    const vino = await crearVino();
    await admin.from("anadas").insert(anada(vino.id, { anio: 2018 }));
    const { error } = await admin.from("anadas").insert(anada(vino.id, { anio: 2018 }));
    expect(error?.code).toBe("23505");
  });

  it("CA-7: el mismo año sí puede repetirse en vinos distintos", async () => {
    const a = await crearVino();
    const b = await crearVino("Otro vino");
    expect((await admin.from("anadas").insert(anada(a.id, { anio: 2019 }))).error).toBeNull();
    expect((await admin.from("anadas").insert(anada(b.id, { anio: 2019 }))).error).toBeNull();
  });

  it("CA-7: admite varias añadas sin especificar en un mismo vino, para revisar", async () => {
    const vino = await crearVino();
    const sinAnio = { tipo: "sin_especificar", anio: null };
    expect((await admin.from("anadas").insert(anada(vino.id, sinAnio))).error).toBeNull();
    expect((await admin.from("anadas").insert(anada(vino.id, sinAnio))).error).toBeNull();
  });

  it.each([
    ["con_anio sin año", { tipo: "con_anio", anio: null }],
    ["sin_especificar con año", { tipo: "sin_especificar", anio: 2020 }],
    ["sin_anada con año", { tipo: "sin_anada", anio: 2020 }],
    ["año fuera de rango", { tipo: "con_anio", anio: 1800 }],
    ["precio negativo", { precio: -1 }],
  ])("CA-7: rechaza %s", async (_caso, campos) => {
    const vino = await crearVino();
    const { error } = await admin.from("anadas").insert(anada(vino.id, campos));
    expect(error?.code).toBe("23514");
  });

  it("admite una añada sin precio (se muestra como Consultar precio)", async () => {
    const vino = await crearVino();
    const { error } = await admin.from("anadas").insert(anada(vino.id, { precio: null }));
    expect(error).toBeNull();
  });

  it("al borrar el producto se borran sus añadas", async () => {
    const vino = await crearVino();
    const fila = anada(vino.id);
    await admin.from("anadas").insert(fila);
    await admin.from("productos").delete().eq("id", vino.id);
    const { data } = await admin.from("anadas").select("id").eq("codigo_tango", fila.codigo_tango);
    expect(data).toEqual([]);
  });

  it("un visitante no puede leer la tabla de añadas", async () => {
    const vino = await crearVino();
    await admin.from("anadas").insert(anada(vino.id));
    const { data } = await clienteAnon().from("anadas").select("*").eq("producto_id", vino.id);
    expect(data ?? []).toEqual([]);
  });
});
