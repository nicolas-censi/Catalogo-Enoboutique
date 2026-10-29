import "server-only";
// Lo que la importación de Tango necesita saber de la carta actual (spec 008).
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Abreviatura } from "@/lib/tango/nombres";
import type { EstadoActual } from "@/lib/tango/plan";
import type { Database } from "@/lib/tipos-db";

type Cliente = SupabaseClient<Database>;
const PAGINA = 1000; // Supabase devuelve hasta 1000 filas por pedido.

/** Todas las filas de una consulta, de a páginas. */
async function todas<T>(pagina: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const filas: T[] = [];
  for (let desde = 0; ; desde += PAGINA) {
    const { data, error } = await pagina(desde, desde + PAGINA - 1);
    if (error) throw error;
    filas.push(...(data ?? []));
    if (!data || data.length < PAGINA) return filas;
  }
}

export async function leerEstadoActual(cliente: Cliente): Promise<EstadoActual> {
  const [aplicadas, anadas, bodegas, secciones, codigos] = await Promise.all([
    cliente.from("importaciones").select("id", { count: "exact", head: true }).eq("estado", "aplicada"),
    todas((d, h) =>
      cliente
        .from("anadas")
        .select("codigo_tango, anio, precio, descripcion_tango, producto_id, productos(nombre, tipo)")
        .order("codigo_tango")
        .range(d, h),
    ),
    todas((d, h) => cliente.from("bodegas").select("id, codigo_tango, nombre").order("id").range(d, h)),
    cliente.from("secciones").select("id, nombre, seccion_padre_id"),
    todas((d, h) => cliente.from("codigos_barras").select("codigo, producto_id").order("codigo").range(d, h)),
  ]);
  if (aplicadas.error) throw aplicadas.error;
  if (secciones.error) throw secciones.error;
  return {
    primera: (aplicadas.count ?? 0) === 0,
    anadas: anadas.map((a) => ({
      codigo: a.codigo_tango,
      productoId: a.producto_id,
      nombreProducto: a.productos?.nombre ?? "",
      tipoProducto: a.productos?.tipo ?? "vino",
      descripcion: a.descripcion_tango,
      anio: a.anio,
      precio: a.precio,
    })),
    bodegas: bodegas.map((b) => ({ id: b.id, codigo: b.codigo_tango, nombre: b.nombre })),
    secciones: secciones.data
      .filter((s) => !s.seccion_padre_id)
      .map((s) => ({ id: s.id, nombre: s.nombre, tieneSubsecciones: secciones.data.some((h) => h.seccion_padre_id === s.id) })),
    codigosBarras: codigos.map((c) => ({ codigo: c.codigo, productoId: c.producto_id })),
  };
}

export async function leerDiccionario(cliente: Cliente): Promise<Abreviatura[]> {
  const { data, error } = await cliente.from("abreviaturas").select("abreviatura, expansion, es_varietal").order("abreviatura");
  if (error) throw error;
  return data.map((a) => ({ abreviatura: a.abreviatura, expansion: a.expansion, esVarietal: a.es_varietal }));
}
