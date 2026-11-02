// Spec 007 (CA-4): esquema de la respuesta de la IA y su validación.
import { z } from "zod";
import type { RespuestaIA } from "./tipos";

const texto = z.string().nullable();
const direccion = z.string().nullable();

const respuesta = z.object({
  descripcion: texto,
  motivoSinDescripcion: texto,
  paginaFoto: direccion,
  fotoUrl: direccion,
  motivoSinFoto: texto,
});

/** JSON Schema de la respuesta, para pedirle al modelo una salida estructurada. */
export function esquemaJsonRespuesta(): Record<string, unknown> {
  return z.toJSONSchema(respuesta) as Record<string, unknown>;
}

export const MAXIMO_PALABRAS = 100;
const PRECIO = /\$\s?\d|US\$|\bpesos\b|\bprecio/i;
const PUNTAJE = /\b\d{2,3}\s*(puntos|pts\.?)(?=\W|$)|\bpuntaje/i;
const PREMIO = /\bmedalla|\bpremi[oa]|\bgalardon|\btrofeo/i;

const limpiar = (valor: string | null) => {
  if (valor === null) return null;
  const limpio = valor.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return limpio || null;
};

function esHttps(valor: string | null) {
  if (valor === null) return true;
  try {
    return new URL(valor).protocol === "https:";
  } catch {
    return false;
  }
}

export type Lectura = { ok: true; datos: RespuestaIA } | { ok: false; error: string };

/** Valida lo que devolvió el modelo (objeto o texto JSON, con o sin ```). */
export function leerRespuesta(entrada: unknown): Lectura {
  let valor = entrada;
  if (typeof entrada === "string") {
    const sinCercas = entrada.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    try {
      valor = JSON.parse(sinCercas);
    } catch {
      return { ok: false, error: "La respuesta no es JSON." };
    }
  }
  const leida = respuesta.safeParse(valor);
  if (!leida.success) return { ok: false, error: "La respuesta no tiene el formato pedido." };

  const datos: RespuestaIA = {
    descripcion: limpiar(leida.data.descripcion),
    motivoSinDescripcion: limpiar(leida.data.motivoSinDescripcion),
    paginaFoto: leida.data.paginaFoto?.trim() || null,
    fotoUrl: leida.data.fotoUrl?.trim() || null,
    motivoSinFoto: limpiar(leida.data.motivoSinFoto),
  };

  if (!datos.descripcion && !datos.motivoSinDescripcion) return { ok: false, error: "Falta la descripción o el motivo." };
  if (!datos.paginaFoto && !datos.fotoUrl && !datos.motivoSinFoto) return { ok: false, error: "Falta la foto o el motivo." };
  if (!esHttps(datos.paginaFoto) || !esHttps(datos.fotoUrl)) return { ok: false, error: "Las direcciones tienen que ser https." };
  if (datos.descripcion) {
    if (datos.descripcion.split(" ").length > MAXIMO_PALABRAS) return { ok: false, error: "La descripción es demasiado larga." };
    if (PRECIO.test(datos.descripcion) || PUNTAJE.test(datos.descripcion) || PREMIO.test(datos.descripcion)) {
      return { ok: false, error: "La descripción menciona precios, puntajes o premios." };
    }
  }
  return { ok: true, datos };
}
