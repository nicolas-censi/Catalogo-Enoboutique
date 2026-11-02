"use server";

import { revalidatePath } from "next/cache";
import { invalidarCarta } from "@/lib/admin/cache";
import { obtenerSesionPanel } from "@/lib/admin/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

const t = textos.admin.promociones;

async function exigirEncargado() {
  const sesion = await obtenerSesionPanel();
  if (sesion?.rol !== "encargado") throw new Error(textos.admin.sinAcceso);
}

function listo() {
  invalidarCarta();
  revalidatePath("/admin/promociones");
}

/** Suma al final las imágenes ya subidas (desde el navegador). */
export async function crearPromociones(rutas: string[]): Promise<{ error: string | null; aviso: string | null }> {
  await exigirEncargado();
  const validas = rutas.filter((r) => /^promos\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/.test(r));
  const supabase = await crearClienteServidor();
  for (const imagen of validas) {
    const { error } = await supabase.rpc("crear_promocion", { imagen });
    if (error) return { error: textos.admin.errorGuardar, aviso: null };
  }
  listo();
  return { error: null, aviso: t.sumadas(validas.length) };
}

export async function ordenarPromociones(ids: string[]): Promise<{ error: string | null }> {
  await exigirEncargado();
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("ordenar_promociones", { ids });
  if (error) return { error: textos.admin.orden.errorGuardar };
  listo();
  return { error: null };
}

export async function cambiarVisibilidadPromocion(id: string, visible: boolean): Promise<{ error: string | null }> {
  await exigirEncargado();
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("promociones").update({ visible }).eq("id", id);
  if (error) return { error: textos.admin.errorGuardar };
  listo();
  return { error: null };
}

/** Borra la promoción y su imagen. */
export async function borrarPromocion(id: string): Promise<{ error: string | null }> {
  await exigirEncargado();
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("promociones").select("imagen_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("promociones").delete().eq("id", id);
  if (error) return { error: textos.admin.errorGuardar };
  if (data?.imagen_path) await supabase.storage.from("promociones").remove([data.imagen_path]);
  listo();
  return { error: null };
}
