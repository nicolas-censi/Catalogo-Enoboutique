"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { validarContrasena } from "@/lib/admin/validacion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

export async function pedirEnlace(_estado: { enviado: boolean }, formulario: FormData): Promise<{ enviado: boolean }> {
  const email = String(formulario.get("email") ?? "").trim();
  if (email) {
    const h = await headers();
    const origen = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
    const supabase = await crearClienteServidor();
    // Se ignora el resultado: la respuesta es la misma exista o no el email.
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origen}/admin/restablecer/confirmar` });
  }
  return { enviado: true };
}

export type EstadoContrasena = { errores: Partial<Record<"nueva" | "repetida", string>>; error: string | null };

export async function guardarContrasena(_estado: EstadoContrasena, formulario: FormData): Promise<EstadoContrasena> {
  const nueva = String(formulario.get("nueva") ?? "");
  const errores = validarContrasena(nueva, String(formulario.get("repetida") ?? ""));
  if (Object.keys(errores).length > 0) return { errores, error: null };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.updateUser({ password: nueva });
  if (error) return { errores: {}, error: textos.admin.errorGuardar };
  redirect("/admin");
}
