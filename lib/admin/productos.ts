import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/tipos-db";

type Cliente = SupabaseClient<Database>;
export type ProductoAdmin = Database["public"]["Views"]["productos_admin"]["Row"];
export type EstadoFiltro = "ocultos" | "sin-stock" | "a-revisar";
export const ESTADOS: EstadoFiltro[] = ["ocultos", "sin-stock", "a-revisar"];
export const POR_PAGINA = 50;

export type Filtros = { q: string; seccion: string; estado: EstadoFiltro | ""; pagina: number };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Lee los filtros de la dirección (?q=&seccion=&estado=&pagina=), descartando lo inválido. */
export function leerFiltros(parametros: Record<string, string | string[] | undefined>): Filtros {
  const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
  const estado = uno(parametros.estado) as EstadoFiltro;
  const seccion = uno(parametros.seccion);
  const pagina = Number.parseInt(uno(parametros.pagina), 10);
  return {
    q: uno(parametros.q),
    seccion: UUID.test(seccion) ? seccion : "",
    estado: ESTADOS.includes(estado) ? estado : "",
    pagina: Number.isFinite(pagina) && pagina > 0 ? pagina : 1,
  };
}

export async function listarProductosAdmin(
  cliente: Cliente,
  filtros: Filtros,
): Promise<{ productos: ProductoAdmin[]; total: number }> {
  let ordenBusqueda: string[] | null = null;
  if (filtros.q) {
    const { data, error } = await cliente.rpc("buscar_admin", { texto: filtros.q, limite: 500 });
    if (error) throw error;
    ordenBusqueda = data.map((f) => f.producto_id);
    if (ordenBusqueda.length === 0) return { productos: [], total: 0 };
  }

  let consulta = cliente.from("productos_admin").select("*", { count: "exact" });
  if (ordenBusqueda) consulta = consulta.in("id", ordenBusqueda);
  if (filtros.seccion) consulta = consulta.eq("seccion_id", filtros.seccion);
  if (filtros.estado === "ocultos") consulta = consulta.eq("visible", false);
  if (filtros.estado === "sin-stock") consulta = consulta.eq("anadas_en_stock", 0);
  if (filtros.estado === "a-revisar") consulta = consulta.gt("anadas_a_revisar", 0);

  if (ordenBusqueda) {
    // Con búsqueda: orden por relevancia (lo devuelve buscar_admin), paginado acá.
    const { data, error } = await consulta;
    if (error) throw error;
    const posicion = new Map(ordenBusqueda.map((id, i) => [id, i]));
    const ordenados = data.sort((a, b) => posicion.get(a.id!)! - posicion.get(b.id!)!);
    const desde = (filtros.pagina - 1) * POR_PAGINA;
    return { productos: ordenados.slice(desde, desde + POR_PAGINA), total: ordenados.length };
  }

  const desde = (filtros.pagina - 1) * POR_PAGINA;
  const { data, error, count } = await consulta.order("nombre").range(desde, desde + POR_PAGINA - 1);
  if (error) throw error;
  return { productos: data, total: count ?? data.length };
}

export async function listarSeccionesAdmin(cliente: Cliente) {
  const { data, error } = await cliente.from("secciones").select("id, nombre, visible").order("orden");
  if (error) throw error;
  return data;
}

export type AnadaAdmin = Database["public"]["Tables"]["anadas"]["Row"];
export type FichaProducto = Database["public"]["Tables"]["productos"]["Row"] & {
  anadas: AnadaAdmin[];
  bodegas: { nombre: string } | null;
  codigos_barras: { codigo: string }[];
};

export async function leerFichaProducto(cliente: Cliente, id: string): Promise<FichaProducto | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await cliente.from("productos").select("*, anadas(*), bodegas(nombre), codigos_barras(codigo)").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  // Más nueva primero; sin año al final.
  data.anadas.sort((a, b) => (b.anio ?? -Infinity) - (a.anio ?? -Infinity));
  data.codigos_barras.sort((a, b) => a.codigo.localeCompare(b.codigo));
  return data;
}

export async function listarBodegas(cliente: Cliente): Promise<string[]> {
  const { data, error } = await cliente.from("bodegas").select("nombre").order("nombre");
  if (error) throw error;
  return data.map((b) => b.nombre);
}
