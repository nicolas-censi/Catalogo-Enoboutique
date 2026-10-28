// Herramientas para los tests de base de datos contra el proyecto de Supabase de
// desarrollo. Cada ejecución usa un prefijo único y borra lo que crea.
import { randomUUID } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { aEmailInterno, contrasenaInterna } from "../../lib/admin/usuario";

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

export type Rol = "encargado" | "vendedor";

/**
 * Crea un usuario de prueba y devuelve un cliente con su sesión iniciada.
 * Con `rol`, además lo da de alta en `personal`.
 */
export async function crearUsuario(
  rol?: Rol,
): Promise<{ cliente: SupabaseClient; usuario: User }> {
  // Como las cuentas del panel (spec 012): usuario con email interno y contraseña interna.
  const nombreUsuario = `${prefijo}-${usuariosCreados.length + 1}`;
  const email = aEmailInterno(nombreUsuario);
  const password = randomUUID();
  const { data, error } = await clienteAdmin().auth.admin.createUser({
    email,
    password: contrasenaInterna(password),
    email_confirm: true,
  });
  if (error) throw error;
  usuariosCreados.push(data.user.id);

  if (rol) {
    const alta = await clienteAdmin().from("personal").insert({ user_id: data.user.id, rol });
    if (alta.error) throw alta.error;
  }

  const cliente = clienteAnon();
  const sesion = await cliente.auth.signInWithPassword({ email, password: contrasenaInterna(password) });
  if (sesion.error) throw sesion.error;
  return { cliente, usuario: data.user };
}

export type CookieSesion = { name: string; value: string };

/**
 * Crea un usuario de prueba (con rol, si se indica) y devuelve las cookies de sesión
 * tal como las guarda @supabase/ssr en el navegador. Sirve para entrar al panel en los
 * tests e2e sin pasar por el formulario de ingreso.
 */
export async function crearUsuarioConSesion(
  rol?: Rol,
): Promise<{ usuario: User; nombreUsuario: string; email: string; password: string; cookies: CookieSesion[] }> {
  // Como las cuentas del panel (spec 012): usuario con email interno y contraseña interna.
  const nombreUsuario = `${prefijo}-${usuariosCreados.length + 1}`;
  const email = aEmailInterno(nombreUsuario);
  const password = randomUUID();
  const { data, error } = await clienteAdmin().auth.admin.createUser({
    email,
    password: contrasenaInterna(password),
    email_confirm: true,
  });
  if (error) throw error;
  usuariosCreados.push(data.user.id);
  if (rol) {
    const alta = await clienteAdmin().from("personal").insert({ user_id: data.user.id, rol });
    if (alta.error) throw alta.error;
  }

  const frasco = new Map<string, string>();
  const cliente = createServerClient(url(), variable("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), {
    cookies: {
      getAll: () => [...frasco].map(([name, value]) => ({ name, value })),
      setAll: (lista) => lista.forEach(({ name, value }) => frasco.set(name, value)),
    },
  });
  const sesion = await cliente.auth.signInWithPassword({ email, password: contrasenaInterna(password) });
  if (sesion.error) throw sesion.error;
  return { usuario: data.user, nombreUsuario, email, password, cookies: [...frasco].map(([name, value]) => ({ name, value })) };
}

export async function limpiarUsuarios(): Promise<void> {
  const admin = clienteAdmin();
  // También los creados por la app durante el test (por ejemplo, invitaciones): se
  // reconocen por el prefijo en el email.
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const delPrefijo = (data?.users ?? []).filter((u) => u.email?.startsWith(prefijo)).map((u) => u.id);
  for (const id of new Set([...usuariosCreados.splice(0), ...delPrefijo])) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error && error.status !== 404) throw error;
  }
}

/**
 * Borra los datos de prueba de esta ejecución: los que llevan el prefijo en cualquier
 * parte del nombre (algunos tests lo ponen al final para no afectar la búsqueda).
 * Los productos se borran antes que las secciones y bodegas a las que apuntan; sus
 * añadas y códigos de barras se borran en cascada.
 */
export async function limpiarDatos(): Promise<void> {
  const admin = clienteAdmin();
  for (const tabla of ["productos", "secciones", "bodegas"]) {
    const { error } = await admin.from(tabla).delete().like("nombre", `%${prefijo}%`);
    if (error) throw error;
  }
}
