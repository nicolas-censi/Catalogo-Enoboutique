import { createServerClient } from "@supabase/ssr";
import { afterAll, describe, expect, it } from "vitest";
import { crearUsuarioConSesion, limpiarUsuarios } from "./ayudante";

afterAll(limpiarUsuarios);

describe("sesión del personal para tests e2e", () => {
  it("genera las cookies de sesión que entiende @supabase/ssr", async () => {
    const { usuario, cookies } = await crearUsuarioConSesion("encargado");
    expect(cookies.length).toBeGreaterThan(0);
    expect(cookies.every((c) => c.name.startsWith("sb-"))).toBe(true);

    const cliente = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { cookies: { getAll: () => cookies, setAll: () => {} } },
    );
    const { data } = await cliente.auth.getUser();
    expect(data.user?.id).toBe(usuario.id);
  });
});
