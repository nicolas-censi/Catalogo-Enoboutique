// Secciones y subsecciones para el panel (specs 004, 005 y 011).
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/tipos-db";

type Cliente = SupabaseClient<Database>;

export type SeccionAdmin = { id: string; nombre: string; visible: boolean; productos: number; subsecciones: number };

/** Secciones de primer nivel (padre null) o subsecciones de `padre`, en orden. */
export async function listarSeccionesPanel(cliente: Cliente, padre: string | null): Promise<SeccionAdmin[]> {
  const { data, error } = await cliente.from("secciones").select("id, nombre, visible, seccion_padre_id, orden, productos(count)").order("orden");
  if (error) throw error;
  const hijas = new Map<string, number>();
  for (const s of data) if (s.seccion_padre_id) hijas.set(s.seccion_padre_id, (hijas.get(s.seccion_padre_id) ?? 0) + 1);
  return data
    .filter((s) => s.seccion_padre_id === padre)
    .map((s) => ({
      id: s.id,
      nombre: s.nombre,
      visible: s.visible,
      productos: (s.productos as unknown as { count: number }[])[0]?.count ?? 0,
      subsecciones: hijas.get(s.id) ?? 0,
    }));
}

/** "Cava › Joyitas": cómo se nombra una subsección en el panel. */
export const nombreConSeccion = (seccion: string, subseccion: string) => `${seccion} › ${subseccion}`;
