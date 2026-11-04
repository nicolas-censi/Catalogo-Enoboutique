// Spec 009, CA-4: dirección de la carta y el QR como cuadrados (se dibuja con los colores
// de la marca, sin escribir colores a mano).
import QRCode from "qrcode";

export const URL_CARTA_POR_DEFECTO = "https://cava.lehonor.com";

/** La dirección que abre el QR (NEXT_PUBLIC_URL_CARTA o la de producción), sin "/" final. */
export function urlCarta(valor = process.env.NEXT_PUBLIC_URL_CARTA): string {
  const url = (valor ?? "").trim() || URL_CARTA_POR_DEFECTO;
  return url.replace(/\/+$/, "");
}

/** La dirección sin "https://", para mostrarla debajo del QR. */
export const urlVisible = (url: string) => url.replace(/^https?:\/\//, "");

/** Los módulos del QR (true = cuadrado oscuro), con corrección de errores alta. */
export function modulosQr(texto: string): { tamano: number; oscuro: (x: number, y: number) => boolean } {
  const qr = QRCode.create(texto, { errorCorrectionLevel: "H" });
  const { size, data } = qr.modules;
  return { tamano: size, oscuro: (x, y) => data[y * size + x] === 1 };
}
