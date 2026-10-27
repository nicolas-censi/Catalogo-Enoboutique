import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/tipos-db";

/**
 * Cliente de Supabase sin sesión, para leer la carta pública desde el servidor.
 * No usa cookies, así sus lecturas se pueden cachear.
 */
export function crearClientePublico() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
