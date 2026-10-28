"use server";

import { revalidatePath } from "next/cache";
import { exigirPersonal } from "@/lib/admin/acceso";
import { invalidarCarta } from "@/lib/admin/cache";
import { traducirError } from "@/lib/admin/errores";
import { MENSAJES } from "@/lib/admin/validacion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

export type EstadoSeccion = { errorCampo: string | null; error: string | null; aviso: string | null; guardados: number };

function listo() {
  invalidarCarta();
  // También las pantallas de cada sección y subsección.
  revalidatePath("/admin/secciones", "layout");
}

/** Crea una sección al final de la carta, o una subsección si el formulario trae `padre`. */
export async function crearSeccion(estado: EstadoSeccion, formulario: FormData): Promise<EstadoSeccion> {
  await exigirPersonal();
  const nombre = String(formulario.get("nombre") ?? "").trim();
  const padre = String(formulario.get("padre") ?? "");
  if (!nombre) return { ...estado, errorCampo: MENSAJES.nombre, error: null, aviso: null };
  const supabase = await crearClienteServidor();
  let aviso: string | null = null;
  if (padre) {
    // La primera subsección se lleva los productos de la sección (spec 011, CA-2).
    const { data, error } = await supabase.rpc("crear_subseccion", { padre, nombre });
    if (error) return { ...estado, errorCampo: null, error: traducirError(error), aviso: null };
    const movidos = data[0]?.movidos ?? 0;
    if (movidos > 0) {
      const seccion = await supabase.from("secciones").select("nombre").eq("id", padre).single();
      aviso = textos.admin.productosMovidos(movidos, seccion.data?.nombre ?? "", nombre);
    }
  } else {
    const ultima = await supabase
      .from("secciones")
      .select("orden")
      .is("seccion_padre_id", null)
      .order("orden", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await supabase.from("secciones").insert({ nombre, orden: (ultima.data?.orden ?? 0) + 1 });
    if (error) return { ...estado, errorCampo: null, error: traducirError(error), aviso: null };
  }
  listo();
  return { errorCampo: null, error: null, aviso, guardados: estado.guardados + 1 };
}

export async function renombrarSeccion(id: string, nombre: string): Promise<{ error: string | null }> {
  await exigirPersonal();
  if (!nombre.trim()) return { error: MENSAJES.nombre };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("secciones").update({ nombre: nombre.trim() }).eq("id", id);
  if (error) return { error: traducirError(error) };
  listo();
  return { error: null };
}

export async function cambiarVisibilidadSeccion(id: string, visible: boolean): Promise<{ error: string | null }> {
  await exigirPersonal();
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("secciones").update({ visible }).eq("id", id);
  if (error) return { error: textos.admin.errorGuardar };
  listo();
  return { error: null };
}

export async function borrarSeccion(id: string): Promise<{ error: string | null }> {
  await exigirPersonal();
  const supabase = await crearClienteServidor();
  // Una sección con productos o con subsecciones no se borra.
  const hijas = await supabase.from("secciones").select("id", { count: "exact", head: true }).eq("seccion_padre_id", id);
  if (hijas.count) return { error: textos.admin.noBorrarConSubsecciones(hijas.count) };
  const { count } = await supabase.from("productos").select("id", { count: "exact", head: true }).eq("seccion_id", id);
  if (count) return { error: textos.admin.noBorrarSeccion(count) };
  const { error } = await supabase.from("secciones").delete().eq("id", id);
  if (error) return { error: traducirError(error) };
  listo();
  return { error: null };
}

export async function ordenarSecciones(ids: string[]): Promise<{ error: string | null }> {
  await exigirPersonal();
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("ordenar_secciones", { ids });
  if (error) return { error: textos.admin.orden.errorGuardar };
  listo();
  return { error: null };
}
