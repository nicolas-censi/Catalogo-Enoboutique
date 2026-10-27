import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * Destino de los enlaces de los mails de Supabase (contraseña olvidada e invitación).
 * Valida el token e inicia la sesión; después lleva a elegir la contraseña. Usa
 * token_hash (no el código PKCE) para que funcione aunque el enlace se abra en otro
 * dispositivo.
 */
export async function GET(pedido: NextRequest) {
  const tokenHash = pedido.nextUrl.searchParams.get("token_hash");
  const tipo = pedido.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const supabase = await crearClienteServidor();
  if (tokenHash && (tipo === "recovery" || tipo === "invite")) {
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
    if (error) await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/admin/restablecer", pedido.url));
}
