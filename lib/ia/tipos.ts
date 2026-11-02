// Spec 007: tipos de las sugerencias de la IA.
import type { Database } from "@/lib/tipos-db";

/** Lo único que se le cuenta a la IA de un producto (nunca precios ni códigos). */
export type ProductoParaSugerir = {
  nombre: string;
  bodega: string | null;
  varietal: string | null;
  tipo: Database["public"]["Enums"]["tipo_producto"];
  /** Años de las añadas (null = sin especificar). */
  anios: (number | null)[];
};

/** Lo que propone la IA, ya validado. */
export type RespuestaIA = {
  descripcion: string | null;
  motivoSinDescripcion: string | null;
  /** Página oficial del producto, de donde sacar la foto. */
  paginaFoto: string | null;
  /** Dirección de la imagen, si la IA la vio. */
  fotoUrl: string | null;
  motivoSinFoto: string | null;
};

export type UsoIA = { tokensEntrada: number; tokensSalida: number; busquedas: number };

export type SugerenciaIA = RespuestaIA & {
  /** Sitios consultados (según la búsqueda, no según lo que diga el modelo). */
  fuentes: string[];
  uso: UsoIA;
};

export interface Sugeridor {
  sugerir(producto: ProductoParaSugerir): Promise<SugerenciaIA>;
}
