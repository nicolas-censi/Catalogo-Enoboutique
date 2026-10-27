import { describe, expect, it } from "vitest";
import { clienteAdmin, limpiarDatos, prefijo } from "./ayudante";

describe("limpiarDatos", () => {
  it("borra los datos de prueba con el prefijo al principio o al final del nombre", async () => {
    const admin = clienteAdmin();
    const { data: bodega } = await admin.from("bodegas").insert({ nombre: `Bodega ${prefijo}` }).select().single();
    await admin.from("productos").insert([
      { tipo: "vino", nombre: `${prefijo} al principio`, bodega_id: bodega!.id },
      { tipo: "vino", nombre: `Al final ${prefijo}` },
    ]);

    await limpiarDatos();

    const productos = await admin.from("productos").select("id").like("nombre", `%${prefijo}%`);
    const bodegas = await admin.from("bodegas").select("id").like("nombre", `%${prefijo}%`);
    expect(productos.data).toEqual([]);
    expect(bodegas.data).toEqual([]);
  });
});
