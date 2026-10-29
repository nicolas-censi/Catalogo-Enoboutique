// Destacados de una sección (spec 005, CA-3): van primero en la carta, en el orden que
// elige el personal (productos.orden). El resto de la sección se ordena solo.
import type { SupabaseClient } from "@supabase/supabase-js";
import { listarSeccionesPanel, type SeccionAdmin } from "@/lib/admin/secciones";
import type { Database } from "@/lib/tipos-db";

type Cliente = SupabaseClient<Database>;
const TANDA = 200;
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

export type PantallaSeccion = {
  seccion: { id: string; nombre: string };
  /** La sección de la que es subsección, o null si es de primer nivel (spec 011). */
  padre: { id: string; nombre: string } | null;
  /** Solo para secciones de primer nivel. */
  subsecciones: SeccionAdmin[];
  /** Una sección con subsecciones no tiene destacados propios: los tiene cada una. */
  destacados: ProductoDestacable[];
};

export async function leerDestacados(cliente: Cliente, seccionId: string): Promise<PantallaSeccion | null> {
  if (!UUID.test(seccionId)) return null;
  const { data: seccion, error } = await cliente
    .from("secciones")
    .select("id, nombre, seccion_padre_id")
    .eq("id", seccionId)
    .maybeSingle();
  if (error) throw error;
  if (!seccion) return null;
  const padre = seccion.seccion_padre_id
    ? (await cliente.from("secciones").select("id, nombre").eq("id", seccion.seccion_padre_id).single()).data
    : null;
  const subsecciones = padre ? [] : await listarSeccionesPanel(cliente, seccion.id);
  const productos = await cliente
    .from("productos")
    .select(COLUMNAS)
    .eq("seccion_id", seccionId)
    .not("orden", "is", null)
    .order("orden");
  if (productos.error) throw productos.error;
  return {
    seccion: { id: seccion.id, nombre: seccion.nombre },
    padre,
    subsecciones,
    destacados: (productos.data as unknown as Fila[]).map(aDestacable),
  };
}

/** Productos de la sección que todavía no son destacados, por nombre, bodega o código. */
export async function buscarDestacables(cliente: Cliente, seccionId: string, texto: string): Promise<ProductoDestacable[]> {
  if (!UUID.test(seccionId) || texto.trim().length < 2) return [];
  // Todas las coincidencias (Supabase devuelve hasta 1000): se filtra por sección
  // después, y con miles de productos los de la sección podrían quedar fuera de los
  // primeros.
  const busqueda = await cliente.rpc("buscar_admin", { texto, limite: 10000 });
  if (busqueda.error) throw busqueda.error;
  const ids = busqueda.data.map((f) => f.producto_id);
  // De a tandas y en orden de relevancia (los ids no entran en un solo pedido); alcanza
  // con los primeros 10 de la sección.
  const resultados: ProductoDestacable[] = [];
  for (let i = 0; i < ids.length && resultados.length < 10; i += TANDA) {
    const tanda = ids.slice(i, i + TANDA);
    const { data, error } = await cliente.from("productos").select(COLUMNAS).in("id", tanda).eq("seccion_id", seccionId).is("orden", null);
    if (error) throw error;
    const posicion = new Map(tanda.map((id, n) => [id, n]));
    resultados.push(...(data as unknown as Fila[]).sort((a, b) => posicion.get(a.id)! - posicion.get(b.id)!).map(aDestacable));
  }
  return resultados.slice(0, 10);
}
