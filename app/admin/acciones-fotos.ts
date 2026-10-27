"use server";

import { revalidatePath } from "next/cache";
import { exigirPersonal } from "@/lib/admin/acceso";
import { invalidarCarta } from "@/lib/admin/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

/** Guarda la foto ya subida (desde el navegador) y borra la anterior. */
export async function guardarFoto(productoId: string, ruta: string): Promise<{ error: string | null }> {
  await exigirPersonal();
  if (!ruta.startsWith(`productos/${productoId}/`)) return { error: textos.admin.errorGuardar };
  const supabase = await crearClienteServidor();
  const anterior = await supabase.from("productos").select("foto_path").eq("id", productoId).single();
  const { error } = await supabase.from("productos").update({ foto_path: ruta }).eq("id", productoId);
  if (error) return { error: textos.admin.errorGuardar };
  if (anterior.data?.foto_path && anterior.data.foto_path !== ruta) {
    await supabase.storage.from("fotos").remove([anterior.data.foto_path]);
  }
  invalidarCarta();
  revalidatePath(`/admin/productos/${productoId}`);
  return { error: null };
}

export async function quitarFoto(productoId: string): Promise<{ error: string | null }> {
  await exigirPersonal();
  const supabase = await crearClienteServidor();
  const actual = await supabase.from("productos").select("foto_path").eq("id", productoId).single();
  const { error } = await supabase.from("productos").update({ foto_path: null }).eq("id", productoId);
  if (error) return { error: textos.admin.errorGuardar };
  if (actual.data?.foto_path) await supabase.storage.from("fotos").remove([actual.data.foto_path]);
  invalidarCarta();
  revalidatePath(`/admin/productos/${productoId}`);
  return { error: null };
}
