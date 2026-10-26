import { afterAll, describe, expect, it } from "vitest";
import { clienteAnon, crearUsuario, limpiarUsuarios } from "./ayudante";

afterAll(limpiarUsuarios);

describe("conexión con el proyecto de Supabase de desarrollo", () => {
  it("un visitante entra sin sesión", async () => {
    const { data, error } = await clienteAnon().auth.getUser();
    expect(data.user).toBeNull();
    expect(error).not.toBeNull();
  });

  it("un usuario de prueba puede iniciar sesión y se borra al terminar", async () => {
    const { cliente, usuario } = await crearUsuario();
    const { data, error } = await cliente.auth.getUser();
    expect(error).toBeNull();
    expect(data.user?.id).toBe(usuario.id);
  });
});
