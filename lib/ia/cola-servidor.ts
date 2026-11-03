import "server-only";
// Spec 007, T7: la cola con la base y la IA reales.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/tipos-db";
import { iaActiva } from "./ajustes";
import { elegirCandidatos, procesarCola, type ResultadoTanda } from "./cola";
import { resolverSugerencia } from "./procesar";

type Cliente = SupabaseClient<Database>;
const TANDA = 200;

export async function contarEnCola(cliente: Cliente): Promise<number> {
  const { count } = await cliente.from("sugerencias").select("id", { count: "exact", head: true }).in("estado", ["en_cola", "procesando"]);
  return count ?? 0;
}

export function procesarTanda(cliente: Cliente): Promise<ResultadoTanda> {
  return procesarCola({
    iaActiva: () => iaActiva(cliente),
    tomar: async (cantidad, tope) => {
      const { data, error } = await cliente.rpc("tomar_cola", { cantidad, tope_diario: tope });
      if (error) throw error;
      return data ?? [];
    },
    resolver: (id, productoId) => resolverSugerencia(cliente, id, productoId),
    quedan: async () => {
      const { count } = await cliente.from("sugerencias").select("id", { count: "exact", head: true }).eq("estado", "en_cola");
      return count ?? 0;
    },
  });
}

/** Ids a pedir entre los elegidos (CA-2): filtra los completos y los que ya tienen una activa. */
export async function candidatos(cliente: Cliente, ids: string[], incluirCompletos: boolean) {
  const productos: { id: string; descripcion: string | null; foto_path: string | null }[] = [];
  const conActiva = new Set<string>();
  for (let i = 0; i < ids.length; i += TANDA) {
    const parte = ids.slice(i, i + TANDA);
    const [p, s] = await Promise.all([
      cliente.from("productos").select("id, descripcion, foto_path").in("id", parte),
      cliente.from("sugerencias").select("producto_id").in("producto_id", parte).in("estado", ["en_cola", "procesando", "lista"]),
    ]);
    if (p.error) throw p.error;
    if (s.error) throw s.error;
    productos.push(...p.data);
    for (const fila of s.data) conActiva.add(fila.producto_id);
  }
  // Mismo orden en que llegaron.
  const posicion = new Map(ids.map((id, i) => [id, i]));
  productos.sort((a, b) => posicion.get(a.id)! - posicion.get(b.id)!);
  return elegirCandidatos(productos, conActiva, incluirCompletos);
}

export async function encolar(cliente: Cliente, ids: string[]): Promise<number> {
  let creadas = 0;
  for (let i = 0; i < ids.length; i += TANDA) {
    const { data, error } = await cliente
      .from("sugerencias")
      .insert(ids.slice(i, i + TANDA).map((producto_id) => ({ producto_id })))
      .select("id");
    if (error) throw error;
    creadas += data.length;
  }
  return creadas;
}
