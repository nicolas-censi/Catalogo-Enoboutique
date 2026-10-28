import "server-only";
import { createClient } from "@supabase/supabase-js";
import { aEmailInterno, contrasenaInterna, deEmailInterno } from "@/lib/admin/usuario";
import type { Database } from "@/lib/tipos-db";

/**
 * Cliente con la clave secreta, SOLO para la API de administración de Supabase Auth
 * (dar de alta, cambiar contraseñas, dar de baja y ver usuarios). Es la única excepción
 * a "la app no usa la clave secreta": Supabase no permite hacer esto de otra forma. Se
 * usa únicamente desde Server Actions que antes verifican que quien llama es encargado.
 */
function clienteAdministracion() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !clave) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY para gestionar el personal.");
  return createClient<Database>(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Usuario de cada una de las cuentas indicadas (spec 012). */
export async function usuarios(ids: string[]): Promise<Map<string, string>> {
  const { data, error } = await clienteAdministracion().auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const buscadas = new Set(ids);
  return new Map(data.users.filter((u) => buscadas.has(u.id)).map((u) => [u.id, deEmailInterno(u.email ?? "")]));
}

/** Crea la cuenta con usuario y contraseña, lista para entrar (sin mails). */
export async function crearCuenta(usuario: string, contrasena: string): Promise<{ id: string } | { error: "repetido" | "otro" }> {
  const { data, error } = await clienteAdministracion().auth.admin.createUser({
    email: aEmailInterno(usuario),
    password: contrasenaInterna(contrasena),
    email_confirm: true,
  });
  if (error) return { error: error.code === "email_exists" ? "repetido" : "otro" };
  return { id: data.user.id };
}

export async function cambiarContrasenaCuenta(id: string, contrasena: string): Promise<string | null> {
  const { error } = await clienteAdministracion().auth.admin.updateUserById(id, { password: contrasenaInterna(contrasena) });
  return error?.message ?? null;
}

export async function borrarCuenta(id: string): Promise<string | null> {
  const { error } = await clienteAdministracion().auth.admin.deleteUser(id);
  return error?.message ?? null;
}
