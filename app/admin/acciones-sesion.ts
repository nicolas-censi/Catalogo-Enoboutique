"use server";

import { redirect } from "next/navigation";
import { aEmailInterno, contrasenaInterna, validarUsuario } from "@/lib/admin/usuario";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

export type EstadoIngreso = { error: string | null };

export async function ingresar(_estado: EstadoIngreso, datos: FormData): Promise<EstadoIngreso> {
  const validado = validarUsuario(String(datos.get("usuario") ?? ""));
  const contrasena = String(datos.get("password") ?? "");
  if ("error" in validado || !contrasena) return { error: textos.admin.errorIngreso };
  const email = aEmailInterno(validado.usuario);
  const supabase = await crearClienteServidor();
  let { error } = await supabase.auth.signInWithPassword({ email, password: contrasenaInterna(contrasena) });
  // Cuentas de antes de la spec 012: la contraseña está guardada sin el agregado interno.
  // Si entra así, se la actualiza una sola vez.
  if (error && contrasena.length >= 6) {
    ({ error } = await supabase.auth.signInWithPassword({ email, password: contrasena }));
    if (!error) await supabase.auth.updateUser({ password: contrasenaInterna(contrasena) });
  }
  if (error) return { error: textos.admin.errorIngreso };
  redirect("/admin");
}

export async function salir() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/admin/ingresar");
}
