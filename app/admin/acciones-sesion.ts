"use server";

import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

export type EstadoIngreso = { error: string | null };

export async function ingresar(_estado: EstadoIngreso, datos: FormData): Promise<EstadoIngreso> {
  const email = String(datos.get("email") ?? "").trim();
  const password = String(datos.get("password") ?? "");
  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: textos.admin.errorIngreso };
  redirect("/admin");
}

export async function salir() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/admin/ingresar");
}
