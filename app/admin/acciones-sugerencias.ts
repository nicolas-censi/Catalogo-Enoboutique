"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { exigirPersonal } from "@/lib/admin/acceso";
import { invalidarCarta } from "@/lib/admin/cache";
import { rutaFoto } from "@/lib/admin/fotos";
import { idsProductosAdmin, leerFiltros, type Filtros } from "@/lib/admin/productos";
import { iaActiva } from "@/lib/ia/ajustes";
import { candidatos, encolar } from "@/lib/ia/cola-servidor";
import { estimarCosto } from "@/lib/ia/costo";
import { resolverSugerencia } from "@/lib/ia/procesar";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

const t = textos.admin.sugerencias;

/**
 * Spec 007, CA-1 (y 015, CA-3): pide una sugerencia para un producto; se busca en
 * segundo plano. Si ya hay una lista, no pide otra; si había una en cola, la toma.
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

  // Spec 015, CA-3: se busca en segundo plano (después de responder), así el panel no
  // queda esperando a la IA. Cuando termina, el aviso lo cuenta (AvisosSugerencias).
  after(() => resolverSugerencia(supabase, id, productoId));
  revalidatePath(`/admin/productos/${productoId}`);
  return { error: null };
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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Seleccion = { ids: string[] } | { filtros: Filtros };

async function idsDe(supabase: Awaited<ReturnType<typeof crearClienteServidor>>, seleccion: Seleccion) {
  // Lo que llega del navegador se vuelve a validar.
  return "ids" in seleccion
    ? seleccion.ids.filter((id) => UUID.test(id))
    : idsProductosAdmin(supabase, leerFiltros({ q: seleccion.filtros.q, seccion: seleccion.filtros.seccion, estado: seleccion.filtros.estado }));
}

/**
 * Spec 007, CA-2: pone en la cola los productos elegidos (tildados o todos los del
 * filtro). Por defecto solo los que no tienen descripción o foto; hasta 1.000 por vez.
 */
export async function pedirSugerencias(seleccion: Seleccion, incluirCompletos: boolean): Promise<{ error: string | null; aviso: string | null }> {
  await exigirPersonal();
  const supabase = await crearClienteServidor();
  if (!(await iaActiva(supabase))) return { error: t.apagada, aviso: null };
  try {
    const { ids, recortados } = await candidatos(supabase, await idsDe(supabase, seleccion), incluirCompletos);
    if (ids.length === 0) return { error: t.ningunoParaPedir, aviso: null };
    const creadas = await encolar(supabase, ids);
    revalidatePath("/admin", "layout");
    return { error: null, aviso: recortados ? t.encoladosConResto(creadas, recortados) : t.encolados(creadas) };
  } catch {
    return { error: t.errorPedir, aviso: null };
  }
}


/** Spec 007, CA-2: cuántos se van a pedir y cuánto costaría, antes de confirmar. */
export async function estimarSugerencias(
  seleccion: Seleccion,
  incluirCompletos: boolean,
): Promise<{ error: string | null; cantidad: number; recortados: number; costoUsd: number }> {
  await exigirPersonal();
  const supabase = await crearClienteServidor();
  if (!(await iaActiva(supabase))) return { error: t.apagada, cantidad: 0, recortados: 0, costoUsd: 0 };
  try {
    const { ids, recortados } = await candidatos(supabase, await idsDe(supabase, seleccion), incluirCompletos);
    const { data } = await supabase.rpc("resumen_ia_mes");
    const mes = data?.[0];
    const promedio =
      mes && mes.promedio_entrada !== null
        ? { tokensEntrada: mes.promedio_entrada, tokensSalida: mes.promedio_salida ?? 0, busquedas: Number(mes.promedio_busquedas ?? 0) }
        : null;
    const costoUsd = estimarCosto({ cantidad: ids.length, promedio, busquedasDelMes: mes?.busquedas ?? 0 });
    return { error: ids.length ? null : t.ningunoParaPedir, cantidad: ids.length, recortados, costoUsd };
  } catch {
    return { error: t.errorPedir, cantidad: 0, recortados: 0, costoUsd: 0 };
  }
}

/** Spec 007, CA-3: vuelve a poner en la cola los productos cuya última sugerencia falló. */
export async function reintentarFallidas(): Promise<{ error: string | null; aviso: string | null }> {
  await exigirPersonal();
  const supabase = await crearClienteServidor();
  if (!(await iaActiva(supabase))) return { error: t.apagada, aviso: null };
  const { data, error } = await supabase.from("sugerencias").select("id, producto_id").eq("estado", "fallo");
  if (error) return { error: t.errorPedir, aviso: null };
  const productos = [...new Set(data.map((f) => f.producto_id))];
  try {
    const { ids } = await candidatos(supabase, productos, true);
    const creadas = ids.length ? await encolar(supabase, ids) : 0;
    // Las fallidas ya reintentadas no se vuelven a mostrar.
    await supabase.from("sugerencias").update({ estado: "descartada" }).in("id", data.map((f) => f.id)).eq("estado", "fallo");
    revalidatePath("/admin/sugerencias");
    return { error: null, aviso: t.reintentadas(creadas) };
  } catch {
    return { error: t.errorPedir, aviso: null };
  }
}
