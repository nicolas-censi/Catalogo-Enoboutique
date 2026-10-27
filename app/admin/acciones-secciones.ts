"use server";

import { revalidatePath } from "next/cache";
import { exigirPersonal } from "@/lib/admin/acceso";
import { invalidarCarta } from "@/lib/admin/cache";
import { traducirError } from "@/lib/admin/errores";
import { MENSAJES } from "@/lib/admin/validacion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

export type EstadoSeccion = { errorCampo: string | null; error: string | null; guardados: number };

function listo() {
  invalidarCarta();
  revalidatePath("/admin/secciones");
}

export async function crearSeccion(estado: EstadoSeccion, formulario: FormData): Promise<EstadoSeccion> {
  await exigirPersonal();
  const nombre = String(formulario.get("nombre") ?? "").trim();
  if (!nombre) return { ...estado, errorCampo: MENSAJES.nombre, error: null };
  const supabase = await crearClienteServidor();
  // Las secciones nuevas quedan al final de la carta.
  const ultima = await supabase.from("secciones").select("orden").order("orden", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("secciones").insert({ nombre, orden: (ultima.data?.orden ?? 0) + 1 });
  if (error) return { ...estado, errorCampo: null, error: traducirError(error) };
  listo();
  return { errorCampo: null, error: null, guardados: estado.guardados + 1 };
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
  // Una sección con productos no se borra (los productos quedarían sin sección).
  const { count } = await supabase.from("productos").select("id", { count: "exact", head: true }).eq("seccion_id", id);
  if (count) return { error: textos.admin.noBorrarSeccion(count) };
  const { error } = await supabase.from("secciones").delete().eq("id", id);
  if (error) return { error: traducirError(error) };
  listo();
  return { error: null };
}
