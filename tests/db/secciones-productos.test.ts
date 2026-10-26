import { afterAll, describe, expect, it } from "vitest";
import { clienteAdmin, clienteAnon, limpiarDatos, prefijo } from "./ayudante";

afterAll(limpiarDatos);

const admin = clienteAdmin();

async function crearSeccion(nombre: string, orden: number, visible = true) {
  const { data, error } = await admin
    .from("secciones")
    .insert({ nombre: `${prefijo} ${nombre}`, orden, visible })
    .select()
    .single();
  if (error) throw error;
  return data;
}

describe("secciones", () => {
  it("se crean, se renombran, se reordenan y se ocultan", async () => {
    const tintos = await crearSeccion("Tintos", 2);
    const cava = await crearSeccion("Cava", 1);

    await admin.from("secciones").update({ nombre: `${prefijo} Cava privada` }).eq("id", cava.id);
    await admin.from("secciones").update({ orden: 3 }).eq("id", cava.id);
    await admin.from("secciones").update({ visible: false }).eq("id", tintos.id);

    const { data } = await admin
      .from("secciones")
      .select("nombre, orden, visible")
      .like("nombre", `${prefijo}%`)
      .order("orden");
    expect(data).toEqual([
      { nombre: `${prefijo} Tintos`, orden: 2, visible: false },
      { nombre: `${prefijo} Cava privada`, orden: 3, visible: true },
    ]);
  });

  it("actualiza actualizado_en en cada cambio", async () => {
    const seccion = await crearSeccion("Blancos", 1);
    await new Promise((resolver) => setTimeout(resolver, 1100));
    const { data } = await admin
      .from("secciones")
      .update({ orden: 5 })
      .eq("id", seccion.id)
      .select()
      .single();
    expect(new Date(data!.actualizado_en).getTime()).toBeGreaterThan(
      new Date(seccion.actualizado_en).getTime(),
    );
  });
});

describe("bodegas", () => {
  it("no admite dos bodegas con el mismo nombre", async () => {
    const nombre = `${prefijo} Salentein`;
    expect((await admin.from("bodegas").insert({ nombre })).error).toBeNull();
    const repetida = await admin.from("bodegas").insert({ nombre });
    expect(repetida.error?.code).toBe("23505");
  });
});

describe("productos", () => {
  it("guarda un vino con su bodega, varietal, sección y orden", async () => {
    const seccion = await crearSeccion("Tintos", 1);
    const { data: bodega } = await admin
      .from("bodegas")
      .insert({ nombre: `${prefijo} Rutini` })
      .select()
      .single();

    const { data, error } = await admin
      .from("productos")
      .insert({
        tipo: "vino",
        nombre: `${prefijo} Rutini Malbec`,
        bodega_id: bodega!.id,
        varietal: "Malbec",
        seccion_id: seccion.id,
        orden: 3,
      })
      .select("tipo, varietal, orden, visible, bodegas(nombre), secciones(nombre)")
      .single();

    expect(error).toBeNull();
    expect(data).toEqual({
      tipo: "vino",
      varietal: "Malbec",
      orden: 3,
      visible: true,
      bodegas: { nombre: `${prefijo} Rutini` },
      secciones: { nombre: `${prefijo} Tintos` },
    });
  });

  it.each(["destilado", "aceite", "almacen"])("acepta productos de tipo %s", async (tipo) => {
    const { error } = await admin
      .from("productos")
      .insert({ tipo, nombre: `${prefijo} producto ${tipo}` });
    expect(error).toBeNull();
  });

  it("rechaza un tipo de producto que no existe", async () => {
    const { error } = await admin
      .from("productos")
      .insert({ tipo: "cerveza", nombre: `${prefijo} cerveza` });
    expect(error?.code).toBe("22P02");
  });
});

describe("acceso sin sesión", () => {
  it("un visitante no puede leer las tablas directamente", async () => {
    await crearSeccion("Visible", 1);
    for (const tabla of ["secciones", "bodegas", "productos"]) {
      const { data } = await clienteAnon().from(tabla).select("*").like("nombre", `${prefijo}%`);
      expect(data ?? []).toEqual([]);
    }
  });
});
