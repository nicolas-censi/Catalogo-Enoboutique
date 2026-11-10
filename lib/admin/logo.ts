// Spec 017, CA-3: el logo se guarda recortado al dibujo, así ocupa todo el alto previsto
// aunque el archivo traiga margen (transparente o de un color liso) alrededor.
import sharp, { type OutputInfo } from "sharp";

const TRANSPARENTE = { r: 0, g: 0, b: 0, alpha: 0 };

export async function recortarLogo(datos: Buffer, formato: "png" | "webp"): Promise<Buffer> {
  const base = sharp(datos, { limitInputPixels: 40_000_000 }).ensureAlpha();
  let recorte: { data: Buffer; info: OutputInfo };
  try {
    // El fondo es el color de la esquina de arriba a la izquierda (transparente o liso).
    recorte = await base.clone().trim({ threshold: 10 }).png().toBuffer({ resolveWithObject: true });
  } catch {
    // Todo de un mismo color: no hay nada que recortar.
    recorte = await base.clone().png().toBuffer({ resolveWithObject: true });
  }
  const { width, height } = recorte.info;
  const margen = Math.round(Math.max(width, height) * 0.01);
  const salida = sharp(recorte.data).extend({ top: margen, bottom: margen, left: margen, right: margen, background: TRANSPARENTE });
  return formato === "png" ? salida.png().toBuffer() : salida.webp({ lossless: true }).toBuffer();
}
