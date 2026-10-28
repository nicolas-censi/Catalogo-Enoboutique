// Destacados de una sección (spec 005, CA-3): van primero en la carta, en el orden que
// elige el personal (productos.orden). El resto de la sección se ordena solo.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/tipos-db";

type Cliente = SupabaseClient<Database>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ProductoDestacable = {
  id: string;
  nombre: string;
  bodega: string | null;
  /** Visible y con alguna añada en stock: se ve en la carta. */
  enCarta: boolean;
};

type Fila = { id: string; nombre: string; visible: boolean; bodegas: { nombre: string } | null; anadas: { en_stock: boolean }[] };
const COLUMNAS = "id, nombre, visible, bodegas(nombre), anadas(en_stock)";

const aDestacable = (p: Fila): ProductoDestacable => ({
  id: p.id,
  nombre: p.nombre,
  bodega: p.bodegas?.nombre ?? null,
  enCarta: p.visible && p.anadas.some((a) => a.en_stock),
});

export async function leerDestacados(
  cliente: Cliente,
  seccionId: string,
): Promise<{ seccion: { id: string; nombre: string }; destacados: ProductoDestacable[] } | null> {
  if (!UUID.test(seccionId)) return null;
  const { data: seccion, error } = await cliente.from("secciones").select("id, nombre").eq("id", seccionId).maybeSingle();
  if (error) throw error;
  if (!seccion) return null;
  const productos = await cliente
    .from("productos")
    .select(COLUMNAS)
    .eq("seccion_id", seccionId)
    .not("orden", "is", null)
    .order("orden");
  if (productos.error) throw productos.error;
  return { seccion, destacados: (productos.data as unknown as Fila[]).map(aDestacable) };
}

/** Productos de la sección que todavía no son destacados, por nombre, bodega o código. */
export async function buscarDestacables(cliente: Cliente, seccionId: string, texto: string): Promise<ProductoDestacable[]> {
  if (!UUID.test(seccionId) || texto.trim().length < 2) return [];
  const busqueda = await cliente.rpc("buscar_admin", { texto, limite: 200 });
  if (busqueda.error) throw busqueda.error;
  const ids = busqueda.data.map((f) => f.producto_id);
  if (ids.length === 0) return [];
  const { data, error } = await cliente
    .from("productos")
    .select(COLUMNAS)
    .in("id", ids)
    .eq("seccion_id", seccionId)
    .is("orden", null);
  if (error) throw error;
  // Se respeta la relevancia que devolvió la búsqueda.
  const posicion = new Map(ids.map((id, i) => [id, i]));
  return (data as unknown as Fila[])
    .sort((a, b) => posicion.get(a.id)! - posicion.get(b.id)!)
    .slice(0, 10)
    .map(aDestacable);
}
