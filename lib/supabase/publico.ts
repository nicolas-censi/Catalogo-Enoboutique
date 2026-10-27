import { createClient } from "@supabase/supabase-js";
import { entornoSupabase } from "@/lib/supabase/entorno";
import type { Database } from "@/lib/tipos-db";

/**
 * Cliente de Supabase sin sesión, para leer la carta pública desde el servidor.
 * No usa cookies, así sus lecturas se pueden cachear.
 */
export function crearClientePublico() {
  const { url, clave } = entornoSupabase();
  return createClient<Database>(url, clave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
