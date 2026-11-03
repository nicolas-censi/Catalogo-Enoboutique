import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clienteAdmin, clienteAnon, crearUsuario, limpiarUsuarios, prefijo } from "./ayudante";

// Spec 007, T1: sugerencias de la IA. Las ve y las maneja todo el personal; nadie más.
// Nada sin aprobar es público (CA-6).
const admin = clienteAdmin();
let vendedor: SupabaseClient;
let noPersonal: SupabaseClient;
const productos: string[] = [];
const carpeta = `pruebas/${prefijo}`;
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

async function crearProducto(n: number) {
  const { data, error } = await admin
    .from("productos")
    .insert({ tipo: "vino", nombre: `${prefijo} sugerencia ${n}` })
    .select("id")
    .single();
  if (error) throw error;
  productos.push(data.id);
  return data.id as string;
}

beforeAll(async () => {
  vendedor = (await crearUsuario("vendedor")).cliente;
  noPersonal = (await crearUsuario()).cliente;
});

afterAll(async () => {
  // Al borrar el producto se borran sus sugerencias.
  await admin.from("productos").delete().in("id", productos);
  const { data } = await admin.storage.from("sugerencias").list(carpeta);
  if (data?.length) await admin.storage.from("sugerencias").remove(data.map((f) => `${carpeta}/${f.name}`));
  await limpiarUsuarios();
});

describe("tabla sugerencias", () => {
  it("el personal pide una sugerencia (queda en cola, a su nombre) y la ve", async () => {
    const producto = await crearProducto(1);
    const { data, error } = await vendedor.from("sugerencias").insert({ producto_id: producto }).select("estado, pedida_por").single();
    expect(error).toBeNull();
    expect(data!.estado).toBe("en_cola");
    const { data: yo } = await vendedor.auth.getUser();
    expect(data!.pedida_por).toBe(yo.user!.id);
  });

  it("una sola sugerencia activa por producto; se puede pedir otra si la anterior se descartó", async () => {
    const producto = await crearProducto(2);
    const primera = await vendedor.from("sugerencias").insert({ producto_id: producto }).select("id").single();
    expect(primera.error).toBeNull();
    expect((await vendedor.from("sugerencias").insert({ producto_id: producto })).error?.code).toBe("23505");
    await vendedor.from("sugerencias").update({ estado: "descartada" }).eq("id", primera.data!.id);
    expect((await vendedor.from("sugerencias").insert({ producto_id: producto })).error).toBeNull();
  });

  it("el público y quien no es personal no ven ni crean sugerencias", async () => {
    const producto = await crearProducto(3);
    await admin.from("sugerencias").insert({ producto_id: producto, estado: "lista", descripcion: "Borrador" });
    for (const cliente of [clienteAnon(), noPersonal]) {
      expect((await cliente.from("sugerencias").select("id").eq("producto_id", producto)).data ?? []).toEqual([]);
      expect((await cliente.from("sugerencias").insert({ producto_id: producto })).error).not.toBeNull();
    }
  });

  it("la carta pública no muestra la descripción sugerida", async () => {
    const producto = productos[2];
    const { data } = await clienteAnon().from("carta_publica").select("descripcion").eq("producto_id", producto);
    for (const fila of data ?? []) expect(fila.descripcion).not.toBe("Borrador");
  });
});

describe("tomar_cola", () => {
  it("toma las en cola sin repetir, las marca procesando y respeta el tope del día", async () => {
    const ids: string[] = [];
    for (const n of [4, 5, 6]) {
      const producto = await crearProducto(n);
      ids.push((await admin.from("sugerencias").insert({ producto_id: producto }).select("id").single()).data!.id);
    }
    // Dos procesos a la vez no se llevan la misma.
    const [a, b] = await Promise.all([
      vendedor.rpc("tomar_cola", { cantidad: 2, tope_diario: 100000 }),
      vendedor.rpc("tomar_cola", { cantidad: 2, tope_diario: 100000 }),
    ]);
    expect(a.error).toBeNull();
    const tomadas = [...(a.data as { id: string }[]), ...(b.data as { id: string }[])].map((s) => s.id);
    expect(new Set(tomadas).size).toBe(tomadas.length);
    const propias = tomadas.filter((id) => ids.includes(id));
    if (propias.length) {
      const { data } = await admin.from("sugerencias").select("estado, intentos").in("id", propias);
      for (const s of data!) expect(s).toEqual({ estado: "procesando", intentos: 1 });
    }
    // Con el tope del día alcanzado no toma nada.
    expect((await vendedor.rpc("tomar_cola", { cantidad: 5, tope_diario: 0 })).data).toEqual([]);
  });

  it("devuelve a la cola las que quedaron procesando más de 10 minutos", async () => {
    const producto = await crearProducto(7);
    const { data } = await admin
      .from("sugerencias")
      .insert({ producto_id: producto, estado: "procesando", tomada_en: new Date(Date.now() - 11 * 60_000).toISOString() })
      .select("id")
      .single();
    await vendedor.rpc("tomar_cola", { cantidad: 0, tope_diario: 100000 });
    expect((await admin.from("sugerencias").select("estado").eq("id", data!.id).single()).data!.estado).toBe("en_cola");
  });

  it("solo el personal puede tomar la cola", async () => {
    expect((await clienteAnon().rpc("tomar_cola", { cantidad: 1, tope_diario: 10 })).error).not.toBeNull();
    expect((await noPersonal.rpc("tomar_cola", { cantidad: 1, tope_diario: 10 })).error?.code).toBe("42501");
  });
});

describe("bucket sugerencias", () => {
  it("es privado: el personal sube y lee con URL firmada; el público no", async () => {
    const ruta = `${carpeta}/foto.webp`;
    expect((await noPersonal.storage.from("sugerencias").upload(ruta, png, { contentType: "image/webp" })).error).not.toBeNull();
    expect((await vendedor.storage.from("sugerencias").upload(ruta, png, { contentType: "image/webp" })).error).toBeNull();
    const publica = clienteAnon().storage.from("sugerencias").getPublicUrl(ruta).data.publicUrl;
    expect((await fetch(publica)).status).toBeGreaterThanOrEqual(400);
    const firmada = await vendedor.storage.from("sugerencias").createSignedUrl(ruta, 60);
    expect(firmada.error).toBeNull();
    expect((await fetch(firmada.data!.signedUrl)).status).toBe(200);
  });
});

describe("resumen_ia_mes (CA-2, CA-7)", () => {
  it("suma el costo y las búsquedas del mes; promedia el uso; solo para el personal", async () => {
    const antes = ((await vendedor.rpc("resumen_ia_mes")).data as { costo_usd: number; busquedas: number; sugerencias: number }[])[0];
    const producto = await crearProducto(8);
    const otro = await crearProducto(9);
    const ahora = new Date().toISOString();
    await admin.from("sugerencias").insert([
      { producto_id: producto, estado: "lista", procesada_en: ahora, tokens_entrada: 1000, tokens_salida: 100, busquedas: 2, costo_usd: 0.05 },
      { producto_id: otro, estado: "fallo", procesada_en: ahora, tokens_entrada: 3000, tokens_salida: 300, busquedas: 4, costo_usd: 0.07 },
    ]);
    const despues = ((await vendedor.rpc("resumen_ia_mes")).data as typeof antes[])[0];
    expect(despues.sugerencias - antes.sugerencias).toBe(2);
    expect(despues.busquedas - antes.busquedas).toBe(6);
    expect(Number(despues.costo_usd) - Number(antes.costo_usd)).toBeCloseTo(0.12, 5);
    expect((await noPersonal.rpc("resumen_ia_mes")).error?.code).toBe("42501");
  });
});
