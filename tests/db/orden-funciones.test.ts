import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clienteAdmin, clienteAnon, crearUsuario, limpiarDatos, limpiarUsuarios, prefijo } from "./ayudante";

// Spec 005, T2: ordenar_secciones y ordenar_destacados.
afterAll(async () => {
  await limpiarDatos();
  await limpiarUsuarios();
});

const admin = clienteAdmin();
let vendedor: SupabaseClient;
let sinRol: SupabaseClient;

async function insertar(tabla: string, fila: Record<string, unknown>) {
  const { data, error } = await admin.from(tabla).insert(fila).select().single();
  if (error) throw error;
  return data as { id: string };
}

const ordenSecciones = async () =>
  ((await admin.from("secciones").select("id").is("seccion_padre_id", null).order("orden").order("id")).data ?? []).map((s) => s.id);

let a: string, b: string, c: string;
let seccion: string, otra: string;
let p1: string, p2: string, p3: string, ajeno: string;

beforeAll(async () => {
  vendedor = (await crearUsuario("vendedor")).cliente;
  sinRol = (await crearUsuario()).cliente;
  a = (await insertar("secciones", { nombre: `${prefijo} A`, orden: 1001 })).id;
  b = (await insertar("secciones", { nombre: `${prefijo} B`, orden: 1002 })).id;
  c = (await insertar("secciones", { nombre: `${prefijo} C`, orden: 1003 })).id;
  seccion = (await insertar("secciones", { nombre: `${prefijo} Destacados`, orden: 1004 })).id;
  otra = (await insertar("secciones", { nombre: `${prefijo} Otra`, orden: 1005 })).id;
  const producto = async (nombre: string, seccion_id: string, orden: number | null = null) =>
    (await insertar("productos", { tipo: "vino", nombre: `${prefijo} ${nombre}`, seccion_id, orden })).id;
  p1 = await producto("Uno", seccion, 1);
  p2 = await producto("Dos", seccion);
  p3 = await producto("Tres", seccion);
  ajeno = await producto("Ajeno", otra);
});

describe("CA-1: ordenar_secciones", () => {
  it("el personal ordena las secciones y se respeta el orden enviado", async () => {
    const actual = await ordenSecciones();
    // Se intercambian A y C, sin tocar el resto.
    const nuevo = actual.map((id) => (id === a ? c : id === c ? a : id));
    const { error } = await vendedor.rpc("ordenar_secciones", { ids: nuevo });
    expect(error).toBeNull();
    const despues = await ordenSecciones();
    expect(despues.indexOf(c)).toBeLessThan(despues.indexOf(b));
    expect(despues.indexOf(b)).toBeLessThan(despues.indexOf(a));
  });

  it("una sección que no vino en la lista (por ejemplo, recién creada) queda al final", async () => {
    const nueva = (await insertar("secciones", { nombre: `${prefijo} Recién creada`, orden: 0 })).id;
    const sinLaNueva = (await ordenSecciones()).filter((id) => id !== nueva);
    const { error } = await vendedor.rpc("ordenar_secciones", { ids: sinLaNueva });
    expect(error).toBeNull();
    expect((await ordenSecciones()).at(-1)).toBe(nueva);
  });

  it("el público y quien no es del personal no pueden ordenar", async () => {
    const ids = await ordenSecciones();
    const publico = await clienteAnon().rpc("ordenar_secciones", { ids: [...ids].reverse() });
    expect(publico.error?.code).toBe("42501");
    const ajenoAlPersonal = await sinRol.rpc("ordenar_secciones", { ids: [...ids].reverse() });
    expect(ajenoAlPersonal.error?.code).toBe("42501");
    expect(await ordenSecciones()).toEqual(ids);
  });
});

describe("CA-3: ordenar_destacados", () => {
  const destacados = async () =>
    ((await admin.from("productos").select("id, orden").eq("seccion_id", seccion).not("orden", "is", null).order("orden")).data ?? []).map(
      (p) => p.id,
    );

  it("guarda los destacados en el orden enviado y saca a los que no vinieron", async () => {
    const { error } = await vendedor.rpc("ordenar_destacados", { seccion, ids: [p3, p2] });
    expect(error).toBeNull();
    expect(await destacados()).toEqual([p3, p2]);
  });

  it("con la lista vacía no queda ningún destacado", async () => {
    const { error } = await vendedor.rpc("ordenar_destacados", { seccion, ids: [] });
    expect(error).toBeNull();
    expect(await destacados()).toEqual([]);
  });

  it("rechaza un producto de otra sección y no cambia nada", async () => {
    await vendedor.rpc("ordenar_destacados", { seccion, ids: [p1] });
    const { error } = await vendedor.rpc("ordenar_destacados", { seccion, ids: [p2, ajeno] });
    expect(error?.message).toBe("Ese producto no es de esta sección.");
    expect(await destacados()).toEqual([p1]);
  });

  it("el público y quien no es del personal no pueden cambiar destacados", async () => {
    expect((await clienteAnon().rpc("ordenar_destacados", { seccion, ids: [p2] })).error?.code).toBe("42501");
    expect((await sinRol.rpc("ordenar_destacados", { seccion, ids: [p2] })).error?.code).toBe("42501");
    expect(await destacados()).toEqual([p1]);
  });
});
