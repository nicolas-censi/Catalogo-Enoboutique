import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clienteAdmin, clienteAnon, limpiarDatos, prefijo } from "./ayudante";

afterAll(limpiarDatos);

const admin = clienteAdmin();
let contador = 0;
const codigos: Record<string, string> = {};

async function insertar(tabla: string, fila: Record<string, unknown>) {
  const { data, error } = await admin.from(tabla).insert(fila).select().single();
  if (error) throw error;
  return data as { id: string };
}

async function vinoConCodigo(clave: string, extra: Record<string, unknown>, seccionId: string) {
  const vino = await insertar("productos", {
    tipo: "vino",
    nombre: `${prefijo} ${clave}`,
    seccion_id: seccionId,
    ...extra,
  });
  codigos[clave] = `${prefijo}-${++contador}`;
  await insertar("codigos_barras", { codigo: codigos[clave], producto_id: vino.id });
  return vino;
}

function anada(productoId: string, anio: number, campos: Record<string, unknown> = {}) {
  return insertar("anadas", {
    producto_id: productoId,
    codigo_tango: `${prefijo}-${++contador}`,
    descripcion_tango: `DESCRIPCION ${anio}`,
    tipo: "con_anio",
    anio,
    precio: 30000,
    en_stock: true,
    ...campos,
  });
}

const buscar = (codigo: string) =>
  clienteAnon().rpc("buscar_por_codigo_barras", { codigo });

beforeAll(async () => {
  const seccion = await insertar("secciones", { nombre: `${prefijo} Cava`, orden: 1 });

  // El código de barras está en el vino; ninguna añada lo tiene propio.
  const pyros = await vinoConCodigo("Pyros Block N4 Malbec", {}, seccion.id);
  await anada(pyros.id, 2014, { precio: 35000 });
  await anada(pyros.id, 2021, { precio: 20500 });
  await anada(pyros.id, 2018, { precio: 26600 });
  await anada(pyros.id, 2015, { en_stock: false });

  const oculto = await vinoConCodigo("Oculto", { visible: false }, seccion.id);
  await anada(oculto.id, 2020);

  const agotado = await vinoConCodigo("Agotado", {}, seccion.id);
  await anada(agotado.id, 2020, { en_stock: false });
});

describe("CA-5: búsqueda por código de barras", () => {
  it("devuelve el vino con todas sus añadas disponibles, de la más nueva a la más vieja", async () => {
    const { data, error } = await buscar(codigos["Pyros Block N4 Malbec"]);
    expect(error).toBeNull();
    expect(data!.map((f: { anio: number; precio: number }) => [f.anio, f.precio])).toEqual([
      [2021, 20500],
      [2018, 26600],
      [2014, 35000],
    ]);
    expect(new Set(data!.map((f: { producto_nombre: string }) => f.producto_nombre))).toEqual(
      new Set([`${prefijo} Pyros Block N4 Malbec`]),
    );
  });

  it("ignora espacios antes o después del código", async () => {
    const { data } = await buscar(`  ${codigos["Pyros Block N4 Malbec"]} `);
    expect(data).toHaveLength(3);
  });

  it("no devuelve nada para un código que no existe", async () => {
    const { data, error } = await buscar(`${prefijo}-inexistente`);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("no devuelve nada para un producto oculto o sin añadas disponibles", async () => {
    expect((await buscar(codigos.Oculto)).data).toEqual([]);
    expect((await buscar(codigos.Agotado)).data).toEqual([]);
  });

  it("no expone datos internos", async () => {
    const { data } = await buscar(codigos["Pyros Block N4 Malbec"]);
    for (const campo of ["codigo_tango", "descripcion_tango", "en_stock"]) {
      expect(data![0]).not.toHaveProperty(campo);
    }
  });
});
