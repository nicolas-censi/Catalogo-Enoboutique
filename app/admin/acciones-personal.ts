"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { obtenerSesionPanel, type Rol } from "@/lib/admin/sesion";
import { traducirError } from "@/lib/admin/errores";
import { borrarCuenta, buscarCuentaPorEmail, invitar } from "@/lib/admin/personal-servidor";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

const t = textos.admin;
const ROLES: Rol[] = ["encargado", "vendedor"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function exigirEncargado() {
  const sesion = await obtenerSesionPanel();
  if (sesion?.rol !== "encargado") throw new Error(t.sinAcceso);
  return sesion;
}

export type EstadoInvitacion = { errorEmail: string | null; error: string | null; enviadoA: string | null; enviados: number };

export async function invitarPersona(estado: EstadoInvitacion, formulario: FormData): Promise<EstadoInvitacion> {
  await exigirEncargado();
  const email = String(formulario.get("email") ?? "").trim().toLowerCase();
  const rol = String(formulario.get("rol") ?? "") as Rol;
  if (!EMAIL.test(email)) return { ...estado, errorEmail: t.emailInvalido, error: null, enviadoA: null };
  if (!ROLES.includes(rol)) return { ...estado, errorEmail: null, error: t.errorGuardar, enviadoA: null };

  const supabase = await crearClienteServidor();
  const existente = await buscarCuentaPorEmail(email);
  let userId: string;
  if (existente) {
    const yaEs = await supabase.from("personal").select("user_id").eq("user_id", existente.id).maybeSingle();
    if (yaEs.data) return { ...estado, errorEmail: null, error: t.yaEsPersonal(email), enviadoA: null };
    // Ya tenía cuenta (por ejemplo, alguien dado de alta antes): solo se lo suma al
    // personal; entra con su contraseña o con "Olvidé mi contraseña".
    userId = existente.id;
  } else {
    const h = await headers();
    const origen = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
    const resultado = await invitar(email, `${origen}/admin/restablecer/confirmar`);
    if ("error" in resultado) return { ...estado, errorEmail: null, error: t.errorInvitar, enviadoA: null };
    userId = resultado.id;
  }

  // El alta en el personal la hace el encargado con su sesión (RLS).
  const { error } = await supabase.from("personal").insert({ user_id: userId, rol });
  if (error) return { ...estado, errorEmail: null, error: traducirError(error), enviadoA: null };
  revalidatePath("/admin/personal");
  return { errorEmail: null, error: null, enviadoA: email, enviados: estado.enviados + 1 };
}

export async function cambiarRol(userId: string, rol: Rol): Promise<{ error: string | null }> {
  await exigirEncargado();
  if (!ROLES.includes(rol)) return { error: t.errorGuardar };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("personal").update({ rol }).eq("user_id", userId);
  if (error) return { error: traducirError(error) };
  revalidatePath("/admin/personal");
  return { error: null };
}

export async function darDeBaja(userId: string): Promise<{ error: string | null }> {
  const sesion = await exigirEncargado();
  if (userId === sesion.id) return { error: t.noDarseDeBaja };
  const supabase = await crearClienteServidor();
  // Primero se lo saca del personal con la sesión del encargado (RLS y reglas)...
  const { error } = await supabase.from("personal").delete().eq("user_id", userId);
  if (error) return { error: traducirError(error) };
  // ...y después se borra la cuenta, para que no pueda volver a entrar.
  const errorCuenta = await borrarCuenta(userId);
  if (errorCuenta) return { error: t.errorGuardar };
  revalidatePath("/admin/personal");
  return { error: null };
}
