// Fotos de productos: validación y reducción en el navegador antes de subirlas
// (las fotos de celular pesan varios MB y la señal del local es mala).
import { textos } from "@/lib/textos";

export const LADO_MAXIMO = 1600;
export const PESO_MAXIMO = 10 * 1024 * 1024;
const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export function medidasReducidas(ancho: number, alto: number, maximo = LADO_MAXIMO) {
  const escala = Math.min(1, maximo / Math.max(ancho, alto));
  return { ancho: Math.round(ancho * escala), alto: Math.round(alto * escala) };
}

export function validarArchivoFoto(archivo: { type: string; size: number; name?: string }): string | null {
  const esHeic = /\.hei[cf]$/i.test(archivo.name ?? "");
  if (!TIPOS.includes(archivo.type) && !esHeic) return textos.admin.fotoNoImagen;
  if (archivo.size > PESO_MAXIMO) return textos.admin.fotoMuyPesada;
  return null;
}

export function rutaFoto(productoId: string, extension: string) {
  return `productos/${productoId}/${crypto.randomUUID()}.${extension}`;
}

/**
 * Achica la foto a 1600 px de lado mayor y la pasa a WebP. Si el navegador no puede
 * leerla (por ejemplo, HEIC en algunos navegadores), devuelve la original.
 */
export async function reducirFoto(archivo: File): Promise<{ datos: Blob; tipo: string; extension: string }> {
  try {
    const imagen = await createImageBitmap(archivo);
    const { ancho, alto } = medidasReducidas(imagen.width, imagen.height);
    const lienzo = new OffscreenCanvas(ancho, alto);
    lienzo.getContext("2d")!.drawImage(imagen, 0, 0, ancho, alto);
    imagen.close();
    const datos = await lienzo.convertToBlob({ type: "image/webp", quality: 0.85 });
    return { datos, tipo: "image/webp", extension: "webp" };
  } catch {
    const extension = archivo.name.split(".").pop()?.toLowerCase() || "jpg";
    return { datos: archivo, tipo: archivo.type || "image/heic", extension };
  }
}
