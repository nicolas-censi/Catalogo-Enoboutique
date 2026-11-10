// Spec 007 (CA-2, CA-7): costo estimado de una sugerencia según el modelo y los precios
// de lista (US$). Modelo por defecto: Gemini 3.1 Pro (T13, decidido el 2026-11-10).
import type { UsoIA } from "./tipos";

export const MODELO_POR_DEFECTO = "gemini-3.1-pro-preview";

/** El modelo que se usa: IA_MODELO si está cargada; si no, el de por defecto. */
export function modeloIA(env: Record<string, string | undefined> = process.env): string {
  return env.IA_MODELO || MODELO_POR_DEFECTO;
}

const CAMBIO_2027 = Date.UTC(2027, 0, 1, 3); // medianoche de Argentina (precio promocional de 3.8 Flash)

export function preciosGemini(fecha = new Date(), modelo = modeloIA()) {
  const porBusqueda = 14 / 1000;
  if (modelo.includes("flash")) {
    const promocional = fecha.getTime() < CAMBIO_2027;
    return { entradaPorMillon: promocional ? 0.75 : 1.5, salidaPorMillon: promocional ? 3.75 : 7.5, porBusqueda };
  }
  // Pro (pedidos de menos de 200 mil tokens).
  return { entradaPorMillon: 2, salidaPorMillon: 12, porBusqueda };
}

/** Uso típico por producto, mientras no haya datos reales. */
export const USO_ESTIMADO: UsoIA = { tokensEntrada: 15000, tokensSalida: 2000, busquedas: 3 };

export function costoUsd(uso: UsoIA, fecha = new Date(), modelo = modeloIA()): number {
  const p = preciosGemini(fecha, modelo);
  const total =
    (uso.tokensEntrada * p.entradaPorMillon) / 1e6 + (uso.tokensSalida * p.salidaPorMillon) / 1e6 + uso.busquedas * p.porBusqueda;
  return Math.round(total * 1e5) / 1e5;
}

/** Búsquedas en Google gratis por mes (compartidas entre los modelos Gemini 3 y posteriores). */
export const BUSQUEDAS_GRATIS_MES = 5000;
/**
 * Margen sobre lo calculado con el uso informado por Google: en la prueba de 20
 * productos (2026-11-03) lo facturado fue un 33 % más que lo calculado.
 */
export const AJUSTE_REAL = 1.35;

/** Costo estimado (US$) de pedir `cantidad` sugerencias (CA-2). */
export function estimarCosto(datos: {
  cantidad: number;
  promedio: UsoIA | null;
  busquedasDelMes: number;
  fecha?: Date;
  modelo?: string;
}): number {
  const uso = datos.promedio ?? USO_ESTIMADO;
  const p = preciosGemini(datos.fecha, datos.modelo);
  const tokens = datos.cantidad * ((uso.tokensEntrada * p.entradaPorMillon) / 1e6 + (uso.tokensSalida * p.salidaPorMillon) / 1e6);
  const gratis = Math.max(0, BUSQUEDAS_GRATIS_MES - datos.busquedasDelMes);
  const pagas = Math.max(0, datos.cantidad * uso.busquedas - gratis);
  return (tokens + pagas * p.porBusqueda) * AJUSTE_REAL;
}
