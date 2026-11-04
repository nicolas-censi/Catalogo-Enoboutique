import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/tipos-db";

/**
 * Cliente con la clave secreta para la ruta del cron de sugerencias (spec 007), que no
 * tiene sesión de usuario. Segunda excepción a "la app no usa la clave secreta" (la otra
 * es lib/admin/personal-servidor.ts): solo se usa después de verificar CRON_SECRET.
 */
export function clienteServicio() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !clave) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY.");
  return createClient<Database>(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });
}
