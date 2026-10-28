import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clienteAdmin, clienteAnon, crearUsuario, limpiarDatos, limpiarUsuarios, prefijo } from "./ayudante";

// Spec 011, T1: subsecciones = secciones con sección padre, de un solo nivel.
afterAll(limpiarDatos);

const admin = clienteAdmin();

async function seccion(nombre: string, extra: Record<string, unknown> = {}) {
  const { data, error } = await admin.from("secciones").insert({ nombre: `${prefijo} ${nombre}`, orden: 40000, ...extra }).select().single();
  if (error) throw error;
  return data.id as string;
}

let cava: string, joyitas: string;

beforeAll(async () => {
  cava = await seccion("Cava sub");
  joyitas = await seccion("Joyitas", { seccion_padre_id: cava });
});

describe("CA-1: un solo nivel", () => {
  it("una subsección no puede tener subsecciones", async () => {
    const { error } = await admin.from("secciones").insert({ nombre: `${prefijo} Nieta`, orden: 1, seccion_padre_id: joyitas });
    expect(error?.message).toBe("Una subsección no puede tener subsecciones.");
  });

  it("una sección con subsecciones no puede pasar a ser subsección", async () => {
    const otra = await seccion("Otra");
    const { error } = await admin.from("secciones").update({ seccion_padre_id: otra }).eq("id", cava);
    expect(error?.message).toBe("Una sección con subsecciones no puede pasar a ser subsección.");
  });

  it("una sección no puede ser subsección de sí misma", async () => {
    const sola = await seccion("Sola");
    const { error } = await admin.from("secciones").update({ seccion_padre_id: sola }).eq("id", sola);
    expect(error).not.toBeNull();
  });

  it("no se puede borrar una sección que tiene subsecciones", async () => {
    const { error } = await admin.from("secciones").delete().eq("id", cava);
    expect(error).not.toBeNull();
  });
});

describe("CA-2: todo producto está en una subsección", () => {
  it("no se puede poner un producto en una sección que tiene subsecciones", async () => {
    const { error } = await admin.from("productos").insert({ tipo: "vino", nombre: `${prefijo} Suelto`, seccion_id: cava });
    expect(error?.message).toBe(`Elegí una subsección de ${prefijo} Cava sub.`);
  });

  it("sí en la subsección", async () => {
    const { error } = await admin.from("productos").insert({ tipo: "vino", nombre: `${prefijo} En joyitas`, seccion_id: joyitas });
    expect(error).toBeNull();
  });

  it("una sección con productos no puede recibir subsecciones directamente", async () => {
    const tintos = await seccion("Tintos sub");
    await admin.from("productos").insert({ tipo: "vino", nombre: `${prefijo} Tinto`, seccion_id: tintos });
    const { error } = await admin.from("secciones").insert({ nombre: `${prefijo} Hija`, orden: 1, seccion_padre_id: tintos });
    expect(error?.message).toBe(`${prefijo} Tintos sub tiene productos: creá la subsección desde el panel para moverlos.`);
  });
});

describe("T2: crear_subseccion y ordenar entre hermanas", () => {
  let vendedor: Awaited<ReturnType<typeof crearUsuario>>["cliente"];
  beforeAll(async () => {
    vendedor = (await crearUsuario("vendedor")).cliente;
  });
  afterAll(limpiarUsuarios);

  const productosDe = async (seccionId: string) =>
    ((await admin.from("productos").select("nombre, orden").eq("seccion_id", seccionId).order("nombre")).data ?? []).map(
      (p) => [p.nombre.replace(`${prefijo} `, ""), p.orden],
    );
  const hijas = async (padre: string) =>
    ((await admin.from("secciones").select("nombre").eq("seccion_padre_id", padre).order("orden")).data ?? []).map((s) =>
      s.nombre.replace(`${prefijo} `, ""),
    );

  it("CA-2: la primera subsección se lleva todos los productos, con sus destacados", async () => {
    const blancos = await seccion("Blancos sub");
    await admin.from("productos").insert([
      { tipo: "vino", nombre: `${prefijo} Chardonnay`, seccion_id: blancos, orden: 1 },
      { tipo: "vino", nombre: `${prefijo} Torrontés`, seccion_id: blancos },
    ]);
    const { data, error } = await vendedor.rpc("crear_subseccion", { padre: blancos, nombre: `  ${prefijo} Frescos  ` });
    expect(error).toBeNull();
    expect(data).toMatchObject([{ movidos: 2 }]);
    const nueva = data![0].id;
    expect(await productosDe(blancos)).toEqual([]);
    expect(await productosDe(nueva)).toEqual([
      ["Chardonnay", 1],
      ["Torrontés", null],
    ]);
    // El nombre se guarda sin espacios de más.
    expect(((await admin.from("secciones").select("nombre").eq("id", nueva).single()).data!).nombre).toBe(`${prefijo} Frescos`);
  });

  it("CA-1: las siguientes quedan al final y no mueven productos", async () => {
    const espumantes = await seccion("Espumantes sub");
    await vendedor.rpc("crear_subseccion", { padre: espumantes, nombre: `${prefijo} Brut` });
    const { data } = await vendedor.rpc("crear_subseccion", { padre: espumantes, nombre: `${prefijo} Rosé` });
    expect(data).toMatchObject([{ movidos: 0 }]);
    expect(await hijas(espumantes)).toEqual(["Brut", "Rosé"]);
  });

  it("CA-1: no crea subsecciones dentro de una subsección ni sin nombre", async () => {
    expect((await vendedor.rpc("crear_subseccion", { padre: joyitas, nombre: "X" })).error?.message).toBe(
      "Una subsección no puede tener subsecciones.",
    );
    expect((await vendedor.rpc("crear_subseccion", { padre: cava, nombre: "   " })).error).not.toBeNull();
  });

  it("CA-5: ordena subsecciones entre hermanas sin tocar las secciones", async () => {
    const vinos = await seccion("Vinos sub");
    for (const n of ["A", "B", "C"]) await vendedor.rpc("crear_subseccion", { padre: vinos, nombre: `${prefijo} ${n}` });
    const ids = ((await admin.from("secciones").select("id, nombre").eq("seccion_padre_id", vinos).order("orden")).data ?? []).map((s) => s.id);
    const primerNivel = async () =>
      ((await admin.from("secciones").select("id").is("seccion_padre_id", null).order("orden").order("id")).data ?? []).map((s) => s.id);
    const antes = await primerNivel();
    const { error } = await vendedor.rpc("ordenar_secciones", { ids: [ids[2], ids[0], ids[1]] });
    expect(error).toBeNull();
    expect(await hijas(vinos)).toEqual(["C", "A", "B"]);
    expect(await primerNivel()).toEqual(antes);
  });

  it("CA-5: no mezcla secciones de distinto nivel", async () => {
    const { error } = await vendedor.rpc("ordenar_secciones", { ids: [cava, joyitas] });
    expect(error?.message).toBe("Solo se ordenan juntas las secciones del mismo nivel.");
  });

  it("el público no puede crear subsecciones", async () => {
    expect((await clienteAnon().rpc("crear_subseccion", { padre: cava, nombre: "X" })).error?.code).toBe("42501");
  });
});
