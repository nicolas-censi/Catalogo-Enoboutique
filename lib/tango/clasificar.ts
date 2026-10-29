// Sección y bodega sugeridas para lo que se importa de Tango (spec 008, CA-5 y CA-6).
import { nombreLegible, type Abreviatura } from "@/lib/tango/nombres";
import type { TipoTango } from "@/lib/tango/reporte";

const tiene = (palabras: string[], frases: string[]) => {
  const texto = ` ${palabras.join(" ")} `;
  return frases.some((f) => texto.includes(` ${f} `));
};

const ESPUMANTE = ["ESP", "BRUT", "NAT", "SIDRA", "CH", "CHAMPAGNE", "ESPUMANTE", "ESPUMOSO"];
const ROSADO = ["ROSE", "ROSADO"];
const BLANCO = [
  ...["CHARDO", "SAUV BLANC", "TORR", "VIOG", "RIESLING", "SEM", "BCO", "BLANCO", "BLANCAS", "CHENIN", "WHITE", "BLANC"],
  ...["GEWURZT", "GEWURZTRAIMER", "P GRIGIO", "MOSCATEL", "PEDRO XIMENEZ"],
];
// "BLEND" solo no decide si hay un varietal blanco (un blend blanco es blanco).
const TINTO = [
  ...["MAL", "CAB", "MER", "SYRAH", "P NOIR", "TANNAT", "BON", "P VERDOT", "TTO", "TINTO", "TINTAS", "RED", "CS", "CF"],
  ...["TEMPRANILLO", "CRIOLLA", "CARIGNAN", "TEROLDEGO", "ANCELOTTA", "CORTE"],
];

/** Nombre de la sección sugerida, o null si no se puede decidir (queda sin sección). */
export function seccionSugerida(tipo: TipoTango, descripcion: string): string | null {
  if (tipo === "destilado") return "Destilados";
  if (tipo === "almacen" || tipo === "aceite") return "Almacén";
  if (tipo === "combo") return "Combos y boxes";
  const palabras = descripcion.toUpperCase().replace(/(\S)-(\S)/g, "$1 - $2").split(/\s+/);
  if (tiene(palabras, ESPUMANTE)) return "Espumantes";
  if (tiene(palabras, ROSADO)) return "Rosados";
  const blanco = tiene(palabras, BLANCO);
  const tinto = tiene(palabras, TINTO);
  if (blanco && tinto) return null;
  if (blanco) return "Blancos";
  if (tinto || tiene(palabras, ["BLEND"])) return "Tintos";
  return null;
}

// Estilos, lugares y palabras comunes que no sirven como nombre de bodega.
const NO_SON_BODEGA = [
  ...["RVA", "ESP", "EX", "BRUT", "NAT", "BCO", "TTO", "ROSE", "ORG", "TARDIA", "COS", "PEQ", "PROD", "FCA", "FLIA", "STA"],
  ...["PROY", "TERR", "APO", "ALT", "MZA", "TUPUNG", "GUALTA", "UCO", "AGRELO", "GRAN", "DE", "DEL", "LA", "LAS", "LOS", "EL"],
  ...["MAGNUM", "DOBLE", "CORTE", "EST", "ESTATE", "RED", "WHITE", "TINTO", "DULCE", "RESERVA"],
];

/** Código de bodega de un vino: las letras 3 a 5 del código de Tango ("VIrut0080" → "rut"). */
export function bodegaPorCodigo(codigo: string, tipo: TipoTango): string | null {
  if (tipo !== "vino") return null;
  const letras = codigo.slice(2, 5).toLowerCase();
  return letras.length === 3 ? letras : null;
}

/**
 * Nombre propuesto para una bodega: la palabra que aparece en más de sus vinos, sin
 * contar varietales, estilos, números ni palabras cortas. Se revisa en el panel.
 */
export function nombreSugeridoBodega(descripciones: string[], diccionario: Abreviatura[]): string | null {
  const ignorar = new Set([...diccionario.filter((e) => e.esVarietal).flatMap((e) => e.abreviatura.split(" ")), ...NO_SON_BODEGA]);
  const cuenta = new Map<string, number>();
  for (const d of descripciones) {
    for (const p of new Set(d.toUpperCase().split(/\s+/))) {
      if (p.length < 3 || /\d/.test(p) || ignorar.has(p)) continue;
      cuenta.set(p, (cuenta.get(p) ?? 0) + 1);
    }
  }
  const [mejor] = [...cuenta].sort((x, y) => y[1] - x[1]);
  return mejor ? nombreLegible(mejor[0], diccionario) : null;
}
