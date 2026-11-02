import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clienteAdmin, clienteAnon, crearUsuario, limpiarUsuarios, prefijo } from "./ayudante";

// Spec 013, T5: promociones (solo imagen), bucket y orden. Solo el encargado las cambia.
const admin = clienteAdmin();
let encargado: SupabaseClient;
let vendedor: SupabaseClient;
const ids: string[] = [];
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
const ruta = (n: number) => `promos/${prefijo}-${n}.png`;

beforeAll(async () => {
  encargado = (await crearUsuario("encargado")).cliente;
  vendedor = (await crearUsuario("vendedor")).cliente;
});

afterAll(async () => {
  await admin.from("promociones").delete().in("id", ids);
  await admin.storage.from("promociones").remove([1, 2, 3].map(ruta));
  await limpiarUsuarios();
});

describe("promociones", () => {
  it("el encargado las crea al final; el público ve solo las visibles, en orden", async () => {
    for (const n of [1, 2, 3]) {
      const { data, error } = await encargado.rpc("crear_promocion", { imagen: ruta(n) });
      expect(error).toBeNull();
      ids.push(data as string);
    }
    await encargado.from("promociones").update({ visible: false }).eq("id", ids[1]);
    const { data } = await clienteAnon().from("promociones").select("id, imagen_path").in("id", ids).order("orden");
    expect(data!.map((p) => p.imagen_path)).toEqual([ruta(1), ruta(3)]);
  });

  it("el encargado las ordena", async () => {
    const { error } = await encargado.rpc("ordenar_promociones", { ids: [ids[2], ids[0], ids[1]] });
    expect(error).toBeNull();
    const { data } = await admin.from("promociones").select("id").in("id", ids).order("orden");
    expect(data!.map((p) => p.id)).toEqual([ids[2], ids[0], ids[1]]);
  });

  it("un vendedor y el público no pueden crear, cambiar ni ordenar", async () => {
    expect((await vendedor.rpc("crear_promocion", { imagen: ruta(9) })).error?.code).toBe("42501");
    expect((await clienteAnon().rpc("ordenar_promociones", { ids })).error?.code).toBe("42501");
    await vendedor.from("promociones").update({ visible: false }).eq("id", ids[0]);
    await vendedor.from("promociones").delete().eq("id", ids[0]);
    expect((await admin.from("promociones").select("visible").eq("id", ids[0]).single()).data!.visible).toBe(true);
    // El público no ve las ocultas ni puede leer todo.
    expect((await clienteAnon().from("promociones").select("id").eq("id", ids[1])).data).toEqual([]);
  });

  it("bucket: solo el encargado sube imágenes (JPG, PNG o WebP); se leen públicamente", async () => {
    expect((await vendedor.storage.from("promociones").upload(ruta(1), png, { contentType: "image/png" })).error).not.toBeNull();
    expect((await encargado.storage.from("promociones").upload(ruta(1), png, { contentType: "image/png" })).error).toBeNull();
    expect((await encargado.storage.from("promociones").upload(`promos/${prefijo}.svg`, Buffer.from("<svg/>"), { contentType: "image/svg+xml" })).error).not.toBeNull();
    const url = admin.storage.from("promociones").getPublicUrl(ruta(1)).data.publicUrl;
    expect((await fetch(url)).status).toBe(200);
  });
});
