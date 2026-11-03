import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clienteAdmin, clienteAnon, crearUsuario, limpiarUsuarios } from "./ayudante";

// Spec 007, CA-8: interruptor de la IA. Solo el encargado lo cambia.
const admin = clienteAdmin();
let encargado: SupabaseClient;
let vendedor: SupabaseClient;
let previo: boolean;

beforeAll(async () => {
  previo = (await admin.from("ajustes_ia").select("activa").eq("id", 1).single()).data!.activa;
  encargado = (await crearUsuario("encargado")).cliente;
  vendedor = (await crearUsuario("vendedor")).cliente;
});

afterAll(async () => {
  await admin.from("ajustes_ia").update({ activa: previo }).eq("id", 1);
  await limpiarUsuarios();
});

describe("ajustes_ia", () => {
  it("hay una sola fila y el personal la ve; el público no", async () => {
    expect((await vendedor.from("ajustes_ia").select("activa")).data).toHaveLength(1);
    expect((await clienteAnon().from("ajustes_ia").select("activa")).data ?? []).toEqual([]);
  });

  it("el encargado la prende y la apaga; queda quién y cuándo", async () => {
    expect((await encargado.rpc("cambiar_ia", { activa: true })).error).toBeNull();
    const fila = (await admin.from("ajustes_ia").select("activa, cambiada_por, cambiada_en").eq("id", 1).single()).data!;
    const { data: yo } = await encargado.auth.getUser();
    expect(fila).toMatchObject({ activa: true, cambiada_por: yo.user!.id });
    expect(fila.cambiada_en).toBeTruthy();
    expect((await encargado.rpc("cambiar_ia", { activa: false })).error).toBeNull();
    expect((await admin.from("ajustes_ia").select("activa").eq("id", 1).single()).data!.activa).toBe(false);
  });

  it("un vendedor y el público no la cambian", async () => {
    expect((await vendedor.rpc("cambiar_ia", { activa: true })).error?.code).toBe("42501");
    expect((await clienteAnon().rpc("cambiar_ia", { activa: true })).error).not.toBeNull();
    await vendedor.from("ajustes_ia").update({ activa: true }).eq("id", 1);
    expect((await admin.from("ajustes_ia").select("activa").eq("id", 1).single()).data!.activa).toBe(false);
  });
});
