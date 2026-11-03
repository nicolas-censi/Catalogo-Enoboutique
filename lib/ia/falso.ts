// Spec 007: IA de prueba (IA_FALSA=1). Determinista y sin gastar: para los tests y las
// previews sin clave. "[sin foto]" en el nombre simula que no hay foto; "[falla]", un error.
import type { ProductoParaSugerir, SugerenciaIA, Sugeridor } from "./tipos";

/** Dirección que la descarga de fotos reconoce en modo de prueba (T4). */
export const FOTO_FALSA = "https://ia-falsa.invalid/foto.png";

export class SugeridorFalso implements Sugeridor {
  async sugerir(producto: ProductoParaSugerir): Promise<SugerenciaIA> {
    if (producto.nombre.includes("[falla]")) throw new Error("Falla simulada de la IA.");
    const sinFoto = producto.nombre.includes("[sin foto]");
    const de = producto.bodega ? ` de ${producto.bodega}` : "";
    return {
      descripcion: `${producto.nombre}${de}: un clásico de la casa, de aromas francos y paso amable. Ideal para compartir con carnes asadas y pastas.`,
      motivoSinDescripcion: null,
      paginaFoto: sinFoto ? null : "https://ia-falsa.invalid/producto",
      fotoUrl: sinFoto ? null : FOTO_FALSA,
      motivoSinFoto: sinFoto ? "No encontré una foto oficial." : null,
      fuentes: [{ titulo: "ia-falsa.invalid", url: "https://ia-falsa.invalid/producto" }],
      uso: { tokensEntrada: 15000, tokensSalida: 2000, busquedas: 3 },
    };
  }
}
