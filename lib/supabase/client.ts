import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/tipos-db";

/** Cliente de Supabase para componentes que corren en el navegador. */
export function crearClienteNavegador() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
