import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clienteAdmin, clienteAnon, crearUsuario, limpiarUsuarios, prefijo } from "./ayudante";

// Spec 006, T2: tabla marca (una sola fila) y bucket marca. La fila es la real de la
// base de desarrollo: se guarda como estaba y se restaura al final.
const admin = clienteAdmin();
let encargado: SupabaseClient;
let vendedor: SupabaseClient;
let original: { bienvenida: string | null; logo_path: string | null };
const ruta = `logos/${prefijo}.png`;
// PNG de 1×1 transparente.
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

beforeAll(async () => {
  encargado = (await crearUsuario("encargado")).cliente;
  vendedor = (await crearUsuario("vendedor")).cliente;
  original = (await admin.from("marca").select("bienvenida, logo_path").eq("id", 1).single()).data!;
});

afterAll(async () => {
  await admin.from("marca").update(original).eq("id", 1);
  await admin.storage.from("marca").remove([ruta]);
  await limpiarUsuarios();
});

describe("tabla marca", () => {
  it("hay una sola fila y el público la puede leer", async () => {
    const { data, error } = await clienteAnon().from("marca").select("id, bienvenida, logo_path");
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].id).toBe(1);
  });

  it("CA-1: el encargado cambia la bienvenida", async () => {
    const { error } = await encargado.from("marca").update({ bienvenida: `Hola ${prefijo}` }).eq("id", 1);
    expect(error).toBeNull();
    expect((await clienteAnon().from("marca").select("bienvenida").single()).data!.bienvenida).toBe(`Hola ${prefijo}`);
  });

  it("CA-3: un vendedor y el público no pueden cambiarla", async () => {
    await vendedor.from("marca").update({ bienvenida: "vendedor" }).eq("id", 1);
    await clienteAnon().from("marca").update({ bienvenida: "publico" }).eq("id", 1);
    expect((await admin.from("marca").select("bienvenida").single()).data!.bienvenida).toBe(`Hola ${prefijo}`);
  });

  it("no acepta una bienvenida de más de 200 caracteres ni una segunda fila", async () => {
    expect((await encargado.from("marca").update({ bienvenida: "a".repeat(201) }).eq("id", 1)).error).not.toBeNull();
    expect((await admin.from("marca").insert({ id: 2 })).error).not.toBeNull();
  });
});

describe("bucket marca (CA-2 y CA-3)", () => {
  it("solo el encargado sube logos; se leen públicamente", async () => {
    const delVendedor = await vendedor.storage.from("marca").upload(ruta, png, { contentType: "image/png" });
    expect(delVendedor.error).not.toBeNull();
    const delEncargado = await encargado.storage.from("marca").upload(ruta, png, { contentType: "image/png" });
    expect(delEncargado.error).toBeNull();
    const publica = admin.storage.from("marca").getPublicUrl(ruta).data.publicUrl;
    expect((await fetch(publica)).status).toBe(200);
  });

  it("no acepta SVG", async () => {
    const svg = await encargado.storage.from("marca").upload(`logos/${prefijo}.svg`, Buffer.from("<svg/>"), { contentType: "image/svg+xml" });
    expect(svg.error).not.toBeNull();
  });
});
