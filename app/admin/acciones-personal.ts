"use server";

import { revalidatePath } from "next/cache";
import { obtenerSesionPanel, type Rol } from "@/lib/admin/sesion";
import { traducirError } from "@/lib/admin/errores";
import { borrarCuenta, cambiarContrasenaCuenta, crearCuenta } from "@/lib/admin/personal-servidor";
import { validarContrasena, validarUsuario } from "@/lib/admin/usuario";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

const t = textos.admin;
const ROLES: Rol[] = ["encargado", "vendedor"];

async function exigirEncargado() {
  const sesion = await obtenerSesionPanel();
  if (sesion?.rol !== "encargado") throw new Error(t.sinAcceso);
  return sesion;
}

export type EstadoAlta = {
  errores: Partial<Record<"usuario" | "contrasena", string>>;
  error: string | null;
  creado: string | null;
  creados: number;
};

export async function darDeAlta(estado: EstadoAlta, formulario: FormData): Promise<EstadoAlta> {
  await exigirEncargado();
  const validado = validarUsuario(String(formulario.get("usuario") ?? ""));
  const contrasena = String(formulario.get("contrasena") ?? "");
  const rol = String(formulario.get("rol") ?? "") as Rol;
  const errores: EstadoAlta["errores"] = {};
  if ("error" in validado) errores.usuario = validado.error;
  const errorContrasena = validarContrasena(contrasena);
  if (errorContrasena) errores.contrasena = errorContrasena;
  if (Object.keys(errores).length > 0 || "error" in validado) return { ...estado, errores, error: null, creado: null };
  if (!ROLES.includes(rol)) return { ...estado, errores: {}, error: t.errorGuardar, creado: null };

  const cuenta = await crearCuenta(validado.usuario, contrasena);
  if ("error" in cuenta) {
    return cuenta.error === "repetido"
      ? { ...estado, errores: { usuario: t.usuarioRepetido(validado.usuario) }, error: null, creado: null }
      : { ...estado, errores: {}, error: t.errorGuardar, creado: null };
  }
  // El alta en el personal la hace el encargado con su sesión (RLS). Si falla, se borra
  // la cuenta para no dejarla suelta.
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("personal").insert({ user_id: cuenta.id, rol });
  if (error) {
    await borrarCuenta(cuenta.id);
    return { ...estado, errores: {}, error: traducirError(error), creado: null };
  }
  revalidatePath("/admin/personal");
  return { errores: {}, error: null, creado: validado.usuario, creados: estado.creados + 1 };
}

/** El encargado le pone una contraseña nueva a alguien del personal (también a sí mismo). */
export async function cambiarContrasena(userId: string, contrasena: string): Promise<{ error: string | null; errorCampo: string | null }> {
  await exigirEncargado();
  const errorCampo = validarContrasena(contrasena);
  if (errorCampo) return { error: null, errorCampo };
  const supabase = await crearClienteServidor();
  const esPersonal = await supabase.from("personal").select("user_id").eq("user_id", userId).maybeSingle();
  if (!esPersonal.data) return { error: t.errorGuardar, errorCampo: null };
  if (await cambiarContrasenaCuenta(userId, contrasena)) return { error: t.errorGuardar, errorCampo: null };
  return { error: null, errorCampo: null };
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
