import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clienteAdmin, limpiarDatos, prefijo } from "./ayudante";

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
