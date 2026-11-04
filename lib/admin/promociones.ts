// Promociones del inicio (spec 013): solo una imagen, que se achica antes de subir.
import { textos } from "@/lib/textos";

export const PESO_MAXIMO_PROMOCION = 5 * 1024 * 1024;
const TIPOS = ["image/jpeg", "image/png", "image/webp"];

export function validarArchivoPromocion(archivo: { type: string; size: number }): string | null {
  if (!TIPOS.includes(archivo.type)) return textos.admin.promociones.noImagen;
  if (archivo.size > PESO_MAXIMO_PROMOCION) return textos.admin.promociones.muyPesada;
  return null;
}

export function rutaPromocion(extension: string) {
  return `promos/${crypto.randomUUID()}.${extension}`;
}
