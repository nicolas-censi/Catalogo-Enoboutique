import "server-only";
import { connection } from "next/server";
import { deEmailInterno } from "@/lib/admin/usuario";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Rol = "encargado" | "vendedor";
export type SesionPanel = { id: string; usuario: string; rol: Rol | null };

/**
 * Usuario con sesión iniciada y su rol en el personal (null si no es del personal).
 * Devuelve null si no hay sesión. Valida el token con Supabase (getUser).
 */
export async function obtenerSesionPanel(): Promise<SesionPanel | null> {
  // La sesión depende de cada pedido (y Supabase compara su vencimiento con la hora):
  // nunca se arma de antemano.
  await connection();
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: fila } = await supabase
    .from("personal")
    .select("rol")
    .eq("user_id", data.user.id)
    .maybeSingle();
  return { id: data.user.id, usuario: deEmailInterno(data.user.email ?? ""), rol: (fila?.rol as Rol | undefined) ?? null };
}
