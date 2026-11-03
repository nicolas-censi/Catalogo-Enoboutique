import "server-only";
// Spec 007: resuelve una sugerencia ya creada (estado "procesando"): pide a la IA, baja
// la foto al bucket privado y la deja "lista" o "fallo". Lo usan el pedido de a uno (T5)
// y la cola (T7).
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/tipos-db";
import { iaActiva } from "./ajustes";
import { costoUsd } from "./costo";
import { obtenerFoto, rutaFotoSugerida } from "./foto";
import { obtenerSugeridor } from "./sugeridor";
import type { ProductoParaSugerir, Resultado, UsoIA } from "./tipos";

type Cliente = SupabaseClient<Database>;

export async function leerProductoParaSugerir(cliente: Cliente, productoId: string): Promise<ProductoParaSugerir | null> {
  const { data, error } = await cliente
    .from("productos")
    .select("nombre, tipo, varietal, bodegas(nombre), anadas(anio)")
    .eq("id", productoId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { nombre: data.nombre, tipo: data.tipo, varietal: data.varietal, bodega: data.bodegas?.nombre ?? null, anios: data.anadas.map((a) => a.anio) };
}

function usoEnFila(uso: UsoIA | undefined) {
  if (!uso) return {};
  return { tokens_entrada: uso.tokensEntrada, tokens_salida: uso.tokensSalida, busquedas: uso.busquedas, costo_usd: costoUsd(uso) };
}

/**
 * Cómo quedó la sugerencia. Nunca lanza: los errores quedan en la fila. Con la IA
 * apagada (CA-8) no llama a la IA y la sugerencia vuelve a la cola, sin gastar.
 */
export async function resolverSugerencia(cliente: Cliente, sugerenciaId: string, productoId: string): Promise<Resultado> {
  if (!(await iaActiva(cliente))) {
    await cliente.from("sugerencias").update({ estado: "en_cola", tomada_en: null }).eq("id", sugerenciaId).eq("estado", "procesando");
    return "apagada";
  }
  try {
    const producto = await leerProductoParaSugerir(cliente, productoId);
    if (!producto) throw new Error("El producto ya no existe.");
    const s = await obtenerSugeridor().sugerir(producto);

    let foto: { foto_path: string; foto_url_origen: string; foto_sitio: string } | null = null;
    let motivoSinFoto = s.motivoSinFoto;
    const obtenida = await obtenerFoto(s);
    if (obtenida.ok) {
      const ruta = rutaFotoSugerida(productoId);
      const subida = await cliente.storage.from("sugerencias").upload(ruta, obtenida.datos, { contentType: "image/webp" });
      if (subida.error) motivoSinFoto = "No se pudo guardar la foto.";
      else foto = { foto_path: ruta, foto_url_origen: obtenida.urlOrigen, foto_sitio: obtenida.sitio };
    } else if (obtenida.motivo) {
      motivoSinFoto = obtenida.motivo;
    }

    const { error } = await cliente
      .from("sugerencias")
      .update({
        estado: "lista",
        descripcion: s.descripcion,
        motivo_sin_descripcion: s.motivoSinDescripcion,
        motivo_sin_foto: foto ? null : (motivoSinFoto ?? "No encontré una foto oficial."),
        ...(foto ?? {}),
        fuentes: s.fuentes as unknown as Json,
        error: null,
        procesada_en: new Date().toISOString(),
        ...usoEnFila(s.uso),
      })
      .eq("id", sugerenciaId)
      .eq("estado", "procesando");
    if (error) throw error;
    return "lista";
  } catch (error) {
    const uso = (error as { uso?: UsoIA }).uso;
    await cliente
      .from("sugerencias")
      .update({
        estado: "fallo",
        error: error instanceof Error ? error.message.slice(0, 500) : "Error desconocido.",
        procesada_en: new Date().toISOString(),
        ...usoEnFila(uso),
      })
      .eq("id", sugerenciaId)
      .eq("estado", "procesando");
    return "fallo";
  }
}
