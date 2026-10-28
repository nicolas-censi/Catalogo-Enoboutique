"use server";

import { redirect } from "next/navigation";
import { validarContrasena } from "@/lib/admin/validacion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

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
