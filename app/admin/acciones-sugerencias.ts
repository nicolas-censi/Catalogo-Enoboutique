"use server";

import { revalidatePath } from "next/cache";
import { exigirPersonal } from "@/lib/admin/acceso";
import { invalidarCarta } from "@/lib/admin/cache";
import { rutaFoto } from "@/lib/admin/fotos";
import { iaActiva } from "@/lib/ia/ajustes";
import { resolverSugerencia } from "@/lib/ia/procesar";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

const t = textos.admin.sugerencias;

/**
 * Spec 007, CA-1: pide una sugerencia para un producto y espera el resultado. Si ya hay
 * una lista, no pide otra; si había una en cola, la toma.
 */
export async function pedirSugerencia(productoId: string): Promise<{ error: string | null }> {
  await exigirPersonal();
  const supabase = await crearClienteServidor();
  if (!(await iaActiva(supabase))) return { error: t.apagada };
  const activa = await supabase
    .from("sugerencias")
    .select("id, estado")
    .eq("producto_id", productoId)
    .in("estado", ["en_cola", "procesando", "lista"])
    .maybeSingle();
  if (activa.error) return { error: t.errorPedir };

  let id: string;
  if (activa.data?.estado === "lista") return { error: null };
  if (activa.data?.estado === "procesando") return { error: t.enProceso };
  if (activa.data) {
    const tomada = await supabase
      .from("sugerencias")
      .update({ estado: "procesando", tomada_en: new Date().toISOString(), intentos: 1 })
      .eq("id", activa.data.id)
      .eq("estado", "en_cola")
      .select("id")
      .maybeSingle();
    if (!tomada.data) return { error: t.enProceso };
    id = tomada.data.id;
  } else {
    const nueva = await supabase
      .from("sugerencias")
      .insert({ producto_id: productoId, estado: "procesando", tomada_en: new Date().toISOString(), intentos: 1 })
      .select("id")
      .single();
    if (nueva.error) return { error: nueva.error.code === "23505" ? t.enProceso : t.errorPedir };
    id = nueva.data.id;
  }

  const resultado = await resolverSugerencia(supabase, id, productoId);
  revalidatePath(`/admin/productos/${productoId}`);
  return { error: resultado === "lista" ? null : resultado === "apagada" ? t.apagada : t.errorPedir };
}

/** Spec 007, CA-8: el encargado prende o apaga la IA. */
export async function cambiarIa(activa: boolean): Promise<{ error: string | null }> {
  const sesion = await exigirPersonal();
  if (sesion.rol !== "encargado") return { error: textos.admin.sinAcceso };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("cambiar_ia", { activa });
  if (error) return { error: textos.admin.errorGuardar };
  revalidatePath("/admin/ia");
  revalidatePath("/admin/productos/[id]", "page");
  return { error: null };
}

const MAXIMO_DESCRIPCION = 1000;

/**
 * Spec 007, CA-5: aprueba lo elegido de una sugerencia lista. La descripción (corregida
 * o no) y/o la foto reemplazan las del producto; lo que no se eligió queda como estaba.
 */
export async function aprobarSugerencia(
  id: string,
  eleccion: { descripcion: string | null; usarFoto: boolean },
): Promise<{ error: string | null }> {
  const sesion = await exigirPersonal();
  const descripcion = eleccion.descripcion?.replace(/\s+/g, " ").trim() ?? null;
  if (eleccion.descripcion !== null && !descripcion) return { error: t.escribiDescripcion };
  if (descripcion && descripcion.length > MAXIMO_DESCRIPCION) return { error: t.descripcionLarga };
  if (descripcion === null && !eleccion.usarFoto) return { error: t.eligiAlgo };

  const supabase = await crearClienteServidor();
  const { data: s } = await supabase.from("sugerencias").select("producto_id, estado, foto_path").eq("id", id).maybeSingle();
  if (!s || s.estado !== "lista") return { error: t.yaRevisada };
  const usarFoto = eleccion.usarFoto && !!s.foto_path;
  if (descripcion === null && !usarFoto) return { error: t.eligiAlgo };

  const cambios: { descripcion?: string; foto_path?: string } = {};
  if (descripcion !== null) cambios.descripcion = descripcion;
  let anterior: string | null = null;
  if (usarFoto) {
    const bajada = await supabase.storage.from("sugerencias").download(s.foto_path!);
    if (bajada.error) return { error: textos.admin.errorGuardar };
    const ruta = rutaFoto(s.producto_id, "webp");
    const subida = await supabase.storage.from("fotos").upload(ruta, bajada.data, { contentType: "image/webp" });
    if (subida.error) return { error: textos.admin.errorGuardar };
    anterior = (await supabase.from("productos").select("foto_path").eq("id", s.producto_id).single()).data?.foto_path ?? null;
    cambios.foto_path = ruta;
  }

  const producto = await supabase.from("productos").update(cambios).eq("id", s.producto_id);
  if (producto.error) {
    if (cambios.foto_path) await supabase.storage.from("fotos").remove([cambios.foto_path]);
    return { error: textos.admin.errorGuardar };
  }
  await supabase
    .from("sugerencias")
    .update({
      estado: "aprobada",
      ...(descripcion !== null ? { descripcion } : {}),
      revisada_por: sesion.id,
      revisada_en: new Date().toISOString(),
    })
    .eq("id", id);
  if (anterior) await supabase.storage.from("fotos").remove([anterior]);
  if (s.foto_path) await supabase.storage.from("sugerencias").remove([s.foto_path]);

  invalidarCarta();
  revalidatePath(`/admin/productos/${s.producto_id}`);
  revalidatePath("/admin/sugerencias");
  return { error: null };
}

/** Spec 007, CA-5: descarta la sugerencia; el producto queda como estaba. */
export async function descartarSugerencia(id: string): Promise<{ error: string | null }> {
  const sesion = await exigirPersonal();
  const supabase = await crearClienteServidor();
  const { data: s, error } = await supabase
    .from("sugerencias")
    .update({ estado: "descartada", revisada_por: sesion.id, revisada_en: new Date().toISOString() })
    .eq("id", id)
    .eq("estado", "lista")
    .select("producto_id, foto_path")
    .maybeSingle();
  if (error) return { error: textos.admin.errorGuardar };
  if (!s) return { error: t.yaRevisada };
  if (s.foto_path) await supabase.storage.from("sugerencias").remove([s.foto_path]);
  revalidatePath(`/admin/productos/${s.producto_id}`);
  revalidatePath("/admin/sugerencias");
  return { error: null };
}
