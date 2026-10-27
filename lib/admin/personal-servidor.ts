import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/tipos-db";

/**
 * Cliente con la clave secreta, SOLO para la API de administración de Supabase Auth
 * (invitar, dar de baja, ver emails). Es la única excepción a "la app no usa la clave
 * secreta": Supabase no permite hacer esto de otra forma. Se usa únicamente desde
 * Server Actions que antes verifican que quien llama es encargado.
 */
function clienteAdministracion() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !clave) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY para gestionar el personal.");
  return createClient<Database>(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type CuentaPersonal = { id: string; email: string; activa: boolean };

/** Emails y estado de las cuentas indicadas. */
export async function cuentas(ids: string[]): Promise<Map<string, CuentaPersonal>> {
  const { data, error } = await clienteAdministracion().auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const buscadas = new Set(ids);
  return new Map(
    data.users
      .filter((u) => buscadas.has(u.id))
      .map((u) => [u.id, { id: u.id, email: u.email ?? "", activa: !!u.last_sign_in_at }]),
  );
}

export async function buscarCuentaPorEmail(email: string) {
  const { data, error } = await clienteAdministracion().auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

/**
 * Crea la cuenta y manda el mail de invitación. Con MAILS_DE_PRUEBA=1 (solo tests) crea
 * la cuenta sin mandar el mail.
 */
export async function invitar(email: string, redirectTo: string): Promise<{ id: string } | { error: string }> {
  const admin = clienteAdministracion().auth.admin;
  if (process.env.MAILS_DE_PRUEBA === "1") {
    const { data, error } = await admin.generateLink({ type: "invite", email, options: { redirectTo } });
    return error ? { error: error.message } : { id: data.user.id };
  }
  const { data, error } = await admin.inviteUserByEmail(email, { redirectTo });
  return error ? { error: error.message } : { id: data.user.id };
}

export async function borrarCuenta(id: string): Promise<string | null> {
  const { error } = await clienteAdministracion().auth.admin.deleteUser(id);
  return error?.message ?? null;
}
