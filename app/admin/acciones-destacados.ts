"use server";

import { revalidatePath } from "next/cache";
import { exigirPersonal } from "@/lib/admin/acceso";
import { invalidarCarta } from "@/lib/admin/cache";
import { buscarDestacables, type ProductoDestacable } from "@/lib/admin/destacados";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

/** Guarda los destacados de la sección en este orden (agregar, quitar y ordenar). */
export async function guardarDestacados(seccion: string, ids: string[]): Promise<{ error: string | null }> {
  await exigirPersonal();
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("ordenar_destacados", { seccion, ids });
  if (error) return { error: textos.admin.orden.errorGuardar };
  invalidarCarta();
  revalidatePath(`/admin/secciones/${seccion}`);
  return { error: null };
}

export async function buscarParaDestacar(
  seccion: string,
  texto: string,
): Promise<{ resultados: ProductoDestacable[]; error: string | null }> {
  await exigirPersonal();
  try {
    return { resultados: await buscarDestacables(await crearClienteServidor(), seccion, texto), error: null };
  } catch {
    return { resultados: [], error: textos.admin.destacados.errorBuscar };
  }
}
