import type { SupabaseClient, User } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clienteAdmin, crearUsuario, limpiarUsuarios } from "./ayudante";

// CA-12: solo el encargado gestiona el personal. Nadie puede quitarse el rol ni darse
// de baja a sí mismo, así siempre queda al menos un encargado (el que hace el cambio).
// Los tests solo tocan usuarios creados por ellos mismos.
afterAll(limpiarUsuarios);

const admin = clienteAdmin();
let encargado: { cliente: SupabaseClient; usuario: User };
let otroEncargado: { cliente: SupabaseClient; usuario: User };
let vendedor: { cliente: SupabaseClient; usuario: User };
let sinRol: { usuario: User };

const rolDe = async (id: string) =>
  (await admin.from("personal").select("rol").eq("user_id", id).maybeSingle()).data?.rol ?? null;

beforeAll(async () => {
  encargado = await crearUsuario("encargado");
  otroEncargado = await crearUsuario("encargado");
  vendedor = await crearUsuario("vendedor");
  sinRol = await crearUsuario();
});

describe("CA-12: gestión del personal en la base", () => {
  it("el encargado da de alta a alguien en el personal", async () => {
    const { error } = await encargado.cliente.from("personal").insert({ user_id: sinRol.usuario.id, rol: "vendedor" });
    expect(error).toBeNull();
    expect(await rolDe(sinRol.usuario.id)).toBe("vendedor");
  });

  it("el encargado cambia el rol de otra persona", async () => {
    const subir = await encargado.cliente.from("personal").update({ rol: "encargado" }).eq("user_id", vendedor.usuario.id);
    expect(subir.error).toBeNull();
    expect(await rolDe(vendedor.usuario.id)).toBe("encargado");
    const bajar = await encargado.cliente.from("personal").update({ rol: "vendedor" }).eq("user_id", vendedor.usuario.id);
    expect(bajar.error).toBeNull();
    expect(await rolDe(vendedor.usuario.id)).toBe("vendedor");
  });

  it("un vendedor no puede dar de alta, cambiar roles ni dar de baja", async () => {
    const otro = await crearUsuario();
    const alta = await vendedor.cliente.from("personal").insert({ user_id: otro.usuario.id, rol: "encargado" });
    expect(alta.error?.code).toBe("42501");
    await vendedor.cliente.from("personal").update({ rol: "encargado" }).eq("user_id", vendedor.usuario.id);
    expect(await rolDe(vendedor.usuario.id)).toBe("vendedor");
    await vendedor.cliente.from("personal").delete().eq("user_id", encargado.usuario.id);
    expect(await rolDe(encargado.usuario.id)).toBe("encargado");
  });

  it("el encargado no puede quitarse a sí mismo el rol ni darse de baja", async () => {
    const cambio = await encargado.cliente.from("personal").update({ rol: "vendedor" }).eq("user_id", encargado.usuario.id);
    expect(cambio.error?.message).toBe("No podés quitarte a vos mismo el rol de encargado.");
    const baja = await encargado.cliente.from("personal").delete().eq("user_id", encargado.usuario.id);
    expect(baja.error?.message).toBe("No podés darte de baja a vos mismo.");
    expect(await rolDe(encargado.usuario.id)).toBe("encargado");
  });

  it("el encargado da de baja a otra persona del personal", async () => {
    const { error } = await encargado.cliente.from("personal").delete().eq("user_id", sinRol.usuario.id);
    expect(error).toBeNull();
    expect(await rolDe(sinRol.usuario.id)).toBeNull();
  });

  it("siempre queda al menos un encargado: el que hace los cambios", async () => {
    // Un encargado puede bajar de rol a otro encargado, pero nunca a sí mismo.
    const { error } = await encargado.cliente.from("personal").update({ rol: "vendedor" }).eq("user_id", otroEncargado.usuario.id);
    expect(error).toBeNull();
    expect(await rolDe(otroEncargado.usuario.id)).toBe("vendedor");
    expect(await rolDe(encargado.usuario.id)).toBe("encargado");
  });
});
