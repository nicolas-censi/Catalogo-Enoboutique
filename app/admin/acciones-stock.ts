"use server";

import { exigirPersonal } from "@/lib/admin/acceso";
import { invalidarCarta } from "@/lib/admin/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

export async function cambiarStock(anadaId: string, enStock: boolean): Promise<{ error: string | null }> {
  await exigirPersonal();
  const supabase = await crearClienteServidor();
  const { error, count } = await supabase
    .from("anadas")
    .update({ en_stock: enStock }, { count: "exact" })
    .eq("id", anadaId);
  if (error || count !== 1) return { error: textos.admin.errorGuardar };
  invalidarCarta();
  return { error: null };
}
