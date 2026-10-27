import { afterEach, describe, expect, it, vi } from "vitest";
import { entornoSupabase } from "@/lib/supabase/entorno";

afterEach(() => vi.unstubAllEnvs());

describe("entornoSupabase", () => {
  it("devuelve la URL y la clave publicable", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_x");
    expect(entornoSupabase()).toEqual({ url: "https://abc.supabase.co", clave: "sb_publishable_x" });
  });

  it("dice qué variable falta", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_x");
    expect(() => entornoSupabase()).toThrow(/Faltan variables de entorno de Supabase: NEXT_PUBLIC_SUPABASE_URL\./);
  });
});
