// Herramientas para los tests de base de datos contra el proyecto de Supabase de
// desarrollo. Cada ejecución usa un prefijo único y borra lo que crea.
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

function variable(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre} (ver .env.example).`);
  return valor;
}

const url = () => variable("NEXT_PUBLIC_SUPABASE_URL");
const sinSesionPersistente = { auth: { persistSession: false, autoRefreshToken: false } };

/** Prefijo único de esta ejecución, para nombres y códigos de prueba. */
export const prefijo = `test-${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`;

export function clienteAnon(): SupabaseClient {
  return createClient(url(), variable("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), sinSesionPersistente);
}

/** Cliente con la clave secreta: saltea RLS. Solo para preparar y limpiar datos. */
export function clienteAdmin(): SupabaseClient {
  return createClient(url(), variable("SUPABASE_SERVICE_ROLE_KEY"), sinSesionPersistente);
}

const usuariosCreados: string[] = [];

/** Crea un usuario de prueba y devuelve un cliente con su sesión iniciada. */
export async function crearUsuario(): Promise<{ cliente: SupabaseClient; usuario: User }> {
  const email = `${prefijo}-${usuariosCreados.length + 1}@example.com`;
  const password = randomUUID();
  const { data, error } = await clienteAdmin().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  usuariosCreados.push(data.user.id);

  const cliente = clienteAnon();
  const sesion = await cliente.auth.signInWithPassword({ email, password });
  if (sesion.error) throw sesion.error;
  return { cliente, usuario: data.user };
}

export async function limpiarUsuarios(): Promise<void> {
  const admin = clienteAdmin();
  for (const id of usuariosCreados.splice(0)) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw error;
  }
}

/**
 * Borra los datos de prueba de esta ejecución (los que empiezan con el prefijo).
 * Los productos se borran antes que las secciones y bodegas a las que apuntan.
 */
export async function limpiarDatos(): Promise<void> {
  const admin = clienteAdmin();
  for (const tabla of ["productos", "secciones", "bodegas"]) {
    const { error } = await admin.from(tabla).delete().like("nombre", `${prefijo}%`);
    if (error) throw error;
  }
}
