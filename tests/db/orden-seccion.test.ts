import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { leerSeccion } from "@/lib/carta";
import { clienteAdmin, clienteAnon, limpiarDatos, prefijo } from "./ayudante";

// Spec 005, CA-2: orden de una sección en la carta.
afterAll(limpiarDatos);

const admin = clienteAdmin();
let contador = 0;
let seccion: string;

async function insertar(tabla: string, fila: Record<string, unknown>) {
  const { data, error } = await admin.from(tabla).insert(fila).select().single();
  if (error) throw error;
  return data as { id: string };
}

async function producto(nombre: string, bodega: string | null, precios: number[], orden: number | null = null) {
  const p = await insertar("productos", { tipo: "vino", nombre: `${prefijo} ${nombre}`, seccion_id: seccion, bodega_id: bodega, orden });
  for (const precio of precios) {
    await insertar("anadas", {
      producto_id: p.id,
      codigo_tango: `${prefijo}-sec-${++contador}`,
      descripcion_tango: "DESCRIPCION TANGO",
      tipo: "con_anio",
      anio: 2000 + contador,
      precio,
      en_stock: true,
    });
  }
}

beforeAll(async () => {
  seccion = (await insertar("secciones", { nombre: `${prefijo} Orden carta`, orden: 950 })).id;
  const bodega = async (nombre: string) => (await insertar("bodegas", { nombre: `${prefijo} ${nombre}` })).id;
  const alamos = await bodega("Álamos");
  const altaVista = await bodega("alta vista");
  const bressia = await bodega("Bressia");

  await producto("Bressia destacado", bressia, [1000], 2);
  await producto("Sin bodega destacado", null, [500], 1);
  await producto("Álamos varias añadas", alamos, [80000, 30000]);
  await producto("Álamos Bbb", alamos, [50000]);
  await producto("Álamos Aaa", alamos, [50000]);
  await producto("Alta Vista", altaVista, [20000]);
  await producto("Bressia", bressia, [90000]);
  await producto("Sin bodega barato", null, [10000]);
  await producto("Sin bodega caro", null, [70000]);
});

describe("CA-2: orden de la sección", () => {
  it("destacados primero; después por bodega (sin tildes) y del más caro al más barato", async () => {
    const leida = await leerSeccion(clienteAnon(), seccion);
    expect(leida!.productos.map((p) => p.nombre.replace(`${prefijo} `, ""))).toEqual([
      "Sin bodega destacado",
      "Bressia destacado",
      // Álamos: a igual precio, por nombre; un vino con varias añadas va por la más barata.
      "Álamos Aaa",
      "Álamos Bbb",
      "Álamos varias añadas",
      "Alta Vista",
      "Bressia",
      // Sin bodega, al final, del más caro al más barato.
      "Sin bodega caro",
      "Sin bodega barato",
    ]);
  });
});
