// Marca editable desde el panel (spec 006): bienvenida del inicio y logo.
import { textos } from "@/lib/textos";

const t = textos.admin.marca;
export const LARGO_BIENVENIDA = 200;
export const PESO_MAXIMO_LOGO = 2 * 1024 * 1024;
// Sin SVG: puede llevar código adentro.
export const TIPOS_LOGO = ["image/png", "image/webp"];

export function validarBienvenida(texto: string): { bienvenida: string | null; error: string | null } {
  const bienvenida = texto.trim().replace(/\s+/g, " ");
  if (bienvenida.length > LARGO_BIENVENIDA) return { bienvenida, error: t.bienvenidaLarga };
  return { bienvenida: bienvenida || null, error: null };
}

export function validarArchivoLogo(archivo: { type: string; size: number }): string | null {
  if (!TIPOS_LOGO.includes(archivo.type)) return t.logoNoImagen;
  if (archivo.size > PESO_MAXIMO_LOGO) return t.logoMuyPesado;
  return null;
}

export function rutaLogo(extension: string) {
  return `logos/${crypto.randomUUID()}.${extension}`;
}
