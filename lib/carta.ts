// Lectura de la carta pública. Todo sale de carta_publica / carta_secciones, que ya
// filtran lo oculto y lo sin stock.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/tipos-db";

type Publico = Database["public"];
type Cliente = SupabaseClient<Database>;

// Las columnas de orden (bodega_orden, producto_precio_min) solo sirven para ordenar en
// la base: la búsqueda no las trae y la carta no las muestra.
export type FilaCarta = Omit<Publico["Views"]["carta_publica"]["Row"], "bodega_orden" | "producto_precio_min">;
type TipoAnada = Publico["Enums"]["tipo_anada"];
type TipoProducto = Publico["Enums"]["tipo_producto"];

export type Anada = {
  id: string;
  /** Año a mostrar, o null si la añada no lleva año (sin añada o sin especificar). */
  etiqueta: string | null;
  precio: number | null;
};

export type Producto = {
  id: string;
  tipo: TipoProducto;
  nombre: string;
  bodega: string | null;
  varietal: string | null;
  descripcion: string | null;
  fotoPath: string | null;
  seccion: { id: string; nombre: string };
  anadas: Anada[];
};

export type Seccion = { id: string; nombre: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function etiquetaAnada(tipo: TipoAnada | null, anio: number | null): string | null {
  return tipo === "con_anio" && anio !== null ? String(anio) : null;
}

/** Agrupa filas de carta_publica en productos, respetando el orden de llegada. */
export function agruparPorProducto(filas: FilaCarta[]): Producto[] {
  const productos = new Map<string, Producto & { anios: (number | null)[] }>();

  for (const fila of filas) {
    let producto = productos.get(fila.producto_id!);
    if (!producto) {
      producto = {
        id: fila.producto_id!,
        tipo: fila.producto_tipo!,
        nombre: fila.producto_nombre!,
        bodega: fila.bodega_nombre,
        varietal: fila.varietal,
        descripcion: fila.descripcion,
        fotoPath: fila.foto_path,
        seccion: { id: fila.seccion_id!, nombre: fila.seccion_nombre! },
        anadas: [],
        anios: [],
      };
      productos.set(fila.producto_id!, producto);
    }
    producto.anadas.push({
      id: fila.anada_id!,
      etiqueta: etiquetaAnada(fila.anada_tipo, fila.anio),
      precio: fila.precio,
    });
    producto.anios.push(fila.anio);
  }

  return [...productos.values()].map(({ anios, anadas, ...producto }) => ({
    ...producto,
    anadas: anadas
      .map((anada, i) => ({ anada, anio: anios[i] }))
      // Más nueva primero; las que no tienen año, al final.
      .sort((a, b) => (b.anio ?? -Infinity) - (a.anio ?? -Infinity))
      .map(({ anada }) => anada),
  }));
}

export async function leerSecciones(cliente: Cliente): Promise<Seccion[]> {
  const { data, error } = await cliente.from("carta_secciones").select("id, nombre").order("orden");
  if (error) throw error;
  return data.map((s) => ({ id: s.id!, nombre: s.nombre! }));
}

export async function leerSeccion(
  cliente: Cliente,
  id: string,
): Promise<(Seccion & { productos: Producto[] }) | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await cliente
    .from("carta_publica")
    .select("*")
    .eq("seccion_id", id)
    .order("producto_orden")
    .order("producto_nombre");
  if (error) throw error;
  if (data.length === 0) return null;
  return { id, nombre: data[0].seccion_nombre!, productos: agruparPorProducto(data) };
}

export async function leerProducto(cliente: Cliente, id: string): Promise<Producto | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await cliente.from("carta_publica").select("*").eq("producto_id", id);
  if (error) throw error;
  return agruparPorProducto(data)[0] ?? null;
}

/** Búsqueda tolerante a errores (o por código de barras). Productos por relevancia. */
export async function buscarEnCarta(cliente: Cliente, texto: string): Promise<Producto[]> {
  if (texto.trim().length < 2) return [];
  const { data, error } = await cliente.rpc("buscar_carta", { texto });
  if (error) throw error;
  return agruparPorProducto(data);
}
