import { afterAll, describe, expect, it } from "vitest";
import { clienteAdmin, clienteAnon, limpiarDatos, prefijo } from "./ayudante";

afterAll(limpiarDatos);

const admin = clienteAdmin();
let contador = 0;

async function crearVino() {
  const { data, error } = await admin
    .from("productos")
    .insert({ tipo: "vino", nombre: `${prefijo} vino ${++contador}` })
    .select()
    .single();
  if (error) throw error;
  return data;
}

const codigo = () => `${prefijo}-779807486${++contador}`;

describe("CA-5: códigos de barras", () => {
  it("un vino puede tener varios códigos de barras", async () => {
    const vino = await crearVino();
    const { error } = await admin.from("codigos_barras").insert([
      { codigo: codigo(), producto_id: vino.id },
      { codigo: codigo(), producto_id: vino.id },
    ]);
    expect(error).toBeNull();
    const { data } = await admin.from("codigos_barras").select("codigo").eq("producto_id", vino.id);
    expect(data).toHaveLength(2);
  });

  it("un mismo código no puede pertenecer a dos productos", async () => {
    const a = await crearVino();
    const b = await crearVino();
    const repetido = codigo();
    await admin.from("codigos_barras").insert({ codigo: repetido, producto_id: a.id });
    const { error } = await admin
      .from("codigos_barras")
      .insert({ codigo: repetido, producto_id: b.id });
    expect(error?.code).toBe("23505");
  });

  it("rechaza un código vacío", async () => {
    const vino = await crearVino();
    const { error } = await admin.from("codigos_barras").insert({ codigo: " ", producto_id: vino.id });
    expect(error?.code).toBe("23514");
  });

  it("al borrar el producto se borran sus códigos", async () => {
    const vino = await crearVino();
    const propio = codigo();
    await admin.from("codigos_barras").insert({ codigo: propio, producto_id: vino.id });
    await admin.from("productos").delete().eq("id", vino.id);
    const { data } = await admin.from("codigos_barras").select("codigo").eq("codigo", propio);
    expect(data).toEqual([]);
  });

  it("un visitante no puede leer la tabla directamente", async () => {
    const vino = await crearVino();
    await admin.from("codigos_barras").insert({ codigo: codigo(), producto_id: vino.id });
    const { data } = await clienteAnon().from("codigos_barras").select("*").eq("producto_id", vino.id);
    expect(data ?? []).toEqual([]);
  });
});
