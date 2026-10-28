// Lectura de códigos de barras de botellas: validación del dígito verificador y
// variantes para buscar. Funciones puras (se testean sin cámara).
import { textos } from "@/lib/textos";

/** Formatos de los códigos de las botellas (nombres de la API BarcodeDetector). */
export const FORMATOS = ["ean_13", "ean_8", "upc_a", "upc_e"] as const;
const LARGOS: Record<string, number> = { ean_13: 13, ean_8: 8, upc_a: 12, upc_e: 8 };

/** Dígito verificador GTIN (EAN-8, UPC-A, EAN-13): pesos 3 y 1 desde la derecha. */
function verificadorGtinValido(codigo: string): boolean {
  const digitos = [...codigo].map(Number);
  const verificador = digitos.pop()!;
  const suma = digitos.reverse().reduce((total, d, i) => total + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (suma % 10)) % 10 === verificador;
}

/** UPC-E (8 dígitos) → UPC-A (12 dígitos), según las reglas de compresión de GS1. */
export function expandirUpcE(codigo: string): string {
  const [sistema, d1, d2, d3, d4, d5, d6, verificador] = [...codigo];
  let fabricante: string;
  let producto: string;
  if ("012".includes(d6)) {
    fabricante = `${d1}${d2}${d6}00`;
    producto = `00${d3}${d4}${d5}`;
  } else if (d6 === "3") {
    fabricante = `${d1}${d2}${d3}00`;
    producto = `000${d4}${d5}`;
  } else if (d6 === "4") {
    fabricante = `${d1}${d2}${d3}${d4}0`;
    producto = `0000${d5}`;
  } else {
    fabricante = `${d1}${d2}${d3}${d4}${d5}`;
    producto = `0000${d6}`;
  }
  return `${sistema}${fabricante}${producto}${verificador}`;
}

/** true si el código leído es de un formato de botella y su dígito verificador cierra. */
export function codigoValido(codigo: string, formato: string): boolean {
  const largo = LARGOS[formato];
  if (!largo || codigo.length !== largo || !/^\d+$/.test(codigo)) return false;
  if (formato === "upc_e") return "01".includes(codigo[0]) && verificadorGtinValido(expandirUpcE(codigo));
  return verificadorGtinValido(codigo);
}

/**
 * Variantes a buscar: un mismo producto puede estar cargado en Tango como UPC-A (12
 * dígitos) o como EAN-13 con un 0 adelante, y el lector puede devolver cualquiera.
 */
export function variantesCodigo(codigo: string): string[] {
  if (codigo.length === 12) return [codigo, `0${codigo}`];
  if (codigo.length === 13 && codigo.startsWith("0")) return [codigo, codigo.slice(1)];
  return [codigo];
}

/** Mensaje para el cliente según el error de getUserMedia (o "SinSoporte"). */
export function mensajeErrorCamara(nombreError: string): string {
  const t = textos.escaner;
  if (nombreError === "NotAllowedError" || nombreError === "SecurityError") return t.sinPermiso;
  if (nombreError === "NotFoundError" || nombreError === "OverconstrainedError") return t.sinCamara;
  if (nombreError === "NotReadableError" || nombreError === "AbortError") return t.camaraOcupada;
  return t.sinSoporte;
}
