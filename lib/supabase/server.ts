import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Cliente de Supabase para Server Components, Server Actions y Route Handlers. */
export async function crearClienteServidor() {
  const almacen = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return almacen.getAll();
        },
        setAll(cookiesParaGuardar) {
          try {
            cookiesParaGuardar.forEach(({ name, value, options }) =>
              almacen.set(name, value, options),
            );
          } catch {
            // Desde un Server Component no se pueden escribir cookies; la sesión se
            // refresca en el proxy/middleware cuando haya login (spec 4).
          }
        },
      },
    },
  );
}
