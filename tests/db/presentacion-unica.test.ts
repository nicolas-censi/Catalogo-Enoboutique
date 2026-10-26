import { afterAll, describe, expect, it } from "vitest";
import { clienteAdmin, limpiarDatos, prefijo } from "./ayudante";

afterAll(limpiarDatos);

const admin = clienteAdmin();
let contador = 0;

async function crearProducto(tipo: string) {
  const { data, error } = await admin
    .from("productos")
    .insert({ tipo, nombre: `${prefijo} ${tipo} ${++contador}` })
    .select()
    .single();
  if (error) throw error;
  return data;
}

function presentacion(productoId: string, campos: Record<string, unknown> = {}) {
  return {
    producto_id: productoId,
    codigo_tango: `${prefijo}-${++contador}`,
    descripcion_tango: "W GLENMORANGIE ORIGINAL",
    tipo: "sin_anada",
    anio: null,
    precio: 98000,
    ...campos,
  };
}

describe.each(["destilado", "aceite", "almacen"])("CA-6: productos de tipo %s", (tipo) => {
  it("aceptan una única presentación sin año", async () => {
    const producto = await crearProducto(tipo);
    const { error } = await admin.from("anadas").insert(presentacion(producto.id));
    expect(error).toBeNull();
  });

  it("rechazan una segunda presentación", async () => {
    const producto = await crearProducto(tipo);
    await admin.from("anadas").insert(presentacion(producto.id));
    const { error } = await admin.from("anadas").insert(presentacion(producto.id));
    expect(error?.code).toBe("23514");
  });

  it("rechazan una presentación con año o sin especificar", async () => {
    const producto = await crearProducto(tipo);
    const conAnio = await admin
      .from("anadas")
      .insert(presentacion(producto.id, { tipo: "con_anio", anio: 2020 }));
    expect(conAnio.error?.code).toBe("23514");
    const sinEspecificar = await admin
      .from("anadas")
      .insert(presentacion(producto.id, { tipo: "sin_especificar" }));
    expect(sinEspecificar.error?.code).toBe("23514");
  });
});

describe("CA-6: cambios posteriores", () => {
  it("se puede editar el precio de la única presentación", async () => {
    const producto = await crearProducto("aceite");
    const fila = presentacion(producto.id);
    await admin.from("anadas").insert(fila);
    const { error } = await admin
      .from("anadas")
      .update({ precio: 12000 })
      .eq("codigo_tango", fila.codigo_tango);
    expect(error).toBeNull();
  });

  it("no se puede mover una segunda presentación a un producto que no es vino", async () => {
    const aceite = await crearProducto("aceite");
    const otro = await crearProducto("aceite");
    await admin.from("anadas").insert(presentacion(aceite.id));
    const fila = presentacion(otro.id);
    await admin.from("anadas").insert(fila);
    const { error } = await admin
      .from("anadas")
      .update({ producto_id: aceite.id })
      .eq("codigo_tango", fila.codigo_tango);
    expect(error?.code).toBe("23514");
  });

  it("un vino con varias añadas no puede pasar a ser destilado", async () => {
    const vino = await crearProducto("vino");
    await admin.from("anadas").insert([
      presentacion(vino.id, { tipo: "con_anio", anio: 2019 }),
      presentacion(vino.id, { tipo: "con_anio", anio: 2020 }),
    ]);
    const { error } = await admin.from("productos").update({ tipo: "destilado" }).eq("id", vino.id);
    expect(error?.code).toBe("23514");
  });

  it("un vino con una sola añada sin año sí puede pasar a ser destilado", async () => {
    const vino = await crearProducto("vino");
    await admin.from("anadas").insert(presentacion(vino.id));
    const { error } = await admin.from("productos").update({ tipo: "destilado" }).eq("id", vino.id);
    expect(error).toBeNull();
  });

  it("los vinos siguen admitiendo varias añadas", async () => {
    const vino = await crearProducto("vino");
    const { error } = await admin.from("anadas").insert([
      presentacion(vino.id, { tipo: "con_anio", anio: 2018 }),
      presentacion(vino.id, { tipo: "con_anio", anio: 2020 }),
      presentacion(vino.id, { tipo: "sin_especificar" }),
    ]);
    expect(error).toBeNull();
  });
});
