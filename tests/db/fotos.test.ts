import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clienteAdmin, clienteAnon, crearUsuario, limpiarUsuarios, prefijo } from "./ayudante";

// CA-7: bucket público "fotos". Solo el personal sube, reemplaza y borra.

const carpeta = `productos/${prefijo}`;
let personal: SupabaseClient;
let noPersonal: SupabaseClient;

// PNG de 1×1 px.
const png = () =>
  new Blob([Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0))], {
    type: "image/png",
  });

beforeAll(async () => {
  ({ cliente: personal } = await crearUsuario("vendedor"));
  ({ cliente: noPersonal } = await crearUsuario());
});

afterAll(async () => {
  const { data } = await clienteAdmin().storage.from("fotos").list(carpeta);
  if (data?.length) await clienteAdmin().storage.from("fotos").remove(data.map((f) => `${carpeta}/${f.name}`));
  await limpiarUsuarios();
});

describe("bucket fotos", () => {
  it("el personal sube una foto y cualquiera la ve por su dirección pública", async () => {
    const ruta = `${carpeta}/foto.png`;
    const { error } = await personal.storage.from("fotos").upload(ruta, png(), { contentType: "image/png" });
    expect(error).toBeNull();
    const url = clienteAnon().storage.from("fotos").getPublicUrl(ruta).data.publicUrl;
    const respuesta = await fetch(url);
    expect(respuesta.status).toBe(200);
    expect(respuesta.headers.get("content-type")).toBe("image/png");
  });

  it("el personal reemplaza y borra una foto", async () => {
    const ruta = `${carpeta}/reemplazo.png`;
    await personal.storage.from("fotos").upload(ruta, png(), { contentType: "image/png" });
    const reemplazo = await personal.storage.from("fotos").upload(ruta, png(), { contentType: "image/png", upsert: true });
    expect(reemplazo.error).toBeNull();
    const borrado = await personal.storage.from("fotos").remove([ruta]);
    expect(borrado.error).toBeNull();
    expect(borrado.data).toHaveLength(1);
  });

  it("un visitante o alguien que no es del personal no puede subir", async () => {
    const anon = await clienteAnon().storage.from("fotos").upload(`${carpeta}/anon.png`, png(), { contentType: "image/png" });
    expect(anon.error).not.toBeNull();
    const ajeno = await noPersonal.storage.from("fotos").upload(`${carpeta}/ajeno.png`, png(), { contentType: "image/png" });
    expect(ajeno.error).not.toBeNull();
  });

  it("alguien que no es del personal no puede borrar fotos", async () => {
    const ruta = `${carpeta}/protegida.png`;
    await personal.storage.from("fotos").upload(ruta, png(), { contentType: "image/png" });
    const { data } = await noPersonal.storage.from("fotos").remove([ruta]);
    expect(data ?? []).toHaveLength(0);
    const sigue = await fetch(clienteAnon().storage.from("fotos").getPublicUrl(ruta).data.publicUrl);
    expect(sigue.status).toBe(200);
  });

  it("rechaza archivos que no son imágenes", async () => {
    const texto = new Blob(["hola"], { type: "text/plain" });
    const { error } = await personal.storage.from("fotos").upload(`${carpeta}/nota.txt`, texto, { contentType: "text/plain" });
    expect(error).not.toBeNull();
  });

  it("rechaza archivos de más de 10 MB", async () => {
    const grande = new Blob([new Uint8Array(10 * 1024 * 1024 + 1)], { type: "image/png" });
    const { error } = await personal.storage.from("fotos").upload(`${carpeta}/grande.png`, grande, { contentType: "image/png" });
    expect(error).not.toBeNull();
  });
});
