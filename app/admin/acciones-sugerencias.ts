"use server";

import { revalidatePath } from "next/cache";
import { exigirPersonal } from "@/lib/admin/acceso";
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

  const ok = await resolverSugerencia(supabase, id, productoId);
  revalidatePath(`/admin/productos/${productoId}`);
  return { error: ok ? null : t.errorPedir };
}
