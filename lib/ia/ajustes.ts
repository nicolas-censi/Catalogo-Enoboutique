import "server-only";
// Spec 007, CA-8: ¿está prendida la IA? Ante cualquier duda (error, sin fila), no.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/tipos-db";

export async function iaActiva(cliente: SupabaseClient<Database>): Promise<boolean> {
  const { data, error } = await cliente.from("ajustes_ia").select("activa").eq("id", 1).maybeSingle();
  return !error && data?.activa === true;
}
