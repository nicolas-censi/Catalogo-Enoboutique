import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { traducirError } from "@/lib/admin/errores";
import { clienteAdmin, limpiarDatos, prefijo } from "./ayudante";

// Provoca los errores reales de la base y verifica que se traducen bien.
afterAll(limpiarDatos);

const admin = clienteAdmin();
const ids: Record<string, string> = {};
const codigo = `${prefijo}-VIrut0015`;
const barras = `9994${String(Date.now()).slice(-9)}`;

beforeAll(async () => {
  const vino = await admin.from("productos").insert({ tipo: "vino", nombre: `Vino ${prefijo}` }).select().single();
  const otro = await admin.from("productos").insert({ tipo: "vino", nombre: `Otro ${prefijo}` }).select().single();
  const aceite = await admin.from("productos").insert({ tipo: "aceite", nombre: `Aceite ${prefijo}` }).select().single();
  Object.assign(ids, { vino: vino.data!.id, otro: otro.data!.id, aceite: aceite.data!.id });
  await admin.from("anadas").insert({ producto_id: ids.vino, codigo_tango: codigo, descripcion_tango: "X", tipo: "con_anio", anio: 2020 });
  await admin.from("anadas").insert({ producto_id: ids.aceite, codigo_tango: `${codigo}-ac`, descripcion_tango: "X", tipo: "sin_anada" });
  await admin.from("codigos_barras").insert({ codigo: barras, producto_id: ids.vino });
  await admin.from("bodegas").insert({ nombre: `Bodega ${prefijo}` });
});

describe("traducirError con errores reales de la base", () => {
  it("código de Tango repetido", async () => {
    const { error } = await admin.from("anadas").insert({ producto_id: ids.otro, codigo_tango: codigo, descripcion_tango: "X", tipo: "con_anio", anio: 2019 });
    expect(traducirError(error!)).toBe(`Ya existe una añada con el código ${codigo}.`);
  });

  it("año repetido", async () => {
    const { error } = await admin.from("anadas").insert({ producto_id: ids.vino, codigo_tango: `${codigo}-b`, descripcion_tango: "X", tipo: "con_anio", anio: 2020 });
    expect(traducirError(error!)).toBe("Este vino ya tiene la añada 2020.");
  });

  it("código de barras de otro producto", async () => {
    const { error } = await admin.from("codigos_barras").insert({ codigo: barras, producto_id: ids.otro });
    expect(traducirError(error!, { productoDelCodigo: `Vino ${prefijo}` })).toBe(`El código ${barras} ya es de Vino ${prefijo}.`);
  });

  it("bodega repetida", async () => {
    const { error } = await admin.from("bodegas").insert({ nombre: `Bodega ${prefijo}` });
    expect(traducirError(error!)).toBe(`Ya existe la bodega Bodega ${prefijo}.`);
  });

  it("segunda presentación de un aceite", async () => {
    const { error } = await admin.from("anadas").insert({ producto_id: ids.aceite, codigo_tango: `${codigo}-ac2`, descripcion_tango: "X", tipo: "sin_anada" });
    expect(traducirError(error!)).toBe("Un aceite tiene una sola presentación, sin año.");
  });
});
