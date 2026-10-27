import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { entornoSupabase } from "@/lib/supabase/entorno";

/**
 * Refresca la sesión de Supabase en el panel (/admin), así no vence mientras el
 * personal trabaja. No decide permisos: eso lo verifica cada página y acción en el
 * servidor. No corre en la carta pública, que no usa sesión y se cachea.
 */
export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request });
  const { url, clave } = entornoSupabase();

  const supabase = createServerClient(url, clave, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesParaGuardar, encabezados) {
        cookiesParaGuardar.forEach(({ name, value }) => request.cookies.set(name, value));
        respuesta = NextResponse.next({ request });
        cookiesParaGuardar.forEach(({ name, value, options }) =>
          respuesta.cookies.set(name, value, options),
        );
        Object.entries(encabezados).forEach(([clave, valor]) => respuesta.headers.set(clave, valor));
      },
    },
  });

  // Valida el token con Supabase y, si hace falta, lo renueva (setAll de arriba).
  await supabase.auth.getUser();

  return respuesta;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
