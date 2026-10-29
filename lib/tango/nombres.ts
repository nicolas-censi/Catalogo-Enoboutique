// Nombres legibles a partir de las descripciones abreviadas de Tango (spec 008, CA-4).
// El diccionario se guarda en la base y lo edita el encargado; este es el inicial.

export type Abreviatura = { abreviatura: string; expansion: string; esVarietal: boolean };

const v = (abreviatura: string, expansion: string): Abreviatura => ({ abreviatura, expansion, esVarietal: true });
const a = (abreviatura: string, expansion: string): Abreviatura => ({ abreviatura, expansion, esVarietal: false });

export const DICCIONARIO_INICIAL: Abreviatura[] = [
  // Varietales
  v("MAL", "Malbec"),
  v("MALBEC", "Malbec"),
  v("CAB SAUV", "Cabernet Sauvignon"),
  v("CAB SAUVI", "Cabernet Sauvignon"),
  v("CS", "Cabernet Sauvignon"),
  v("CAB", "Cabernet"),
  v("CAB FRANC", "Cabernet Franc"),
  v("CAB FRAN", "Cabernet Franc"),
  v("CF", "Cabernet Franc"),
  v("P NOIR", "Pinot Noir"),
  v("PINOT NOIR", "Pinot Noir"),
  v("CHARDO", "Chardonnay"),
  v("SAUV BLANC", "Sauvignon Blanc"),
  v("MER", "Merlot"),
  v("TORR", "Torrontés"),
  v("SYRAH", "Syrah"),
  v("VIOG", "Viognier"),
  v("SEM", "Semillón"),
  v("BON", "Bonarda"),
  v("TANNAT", "Tannat"),
  v("P VERDOT", "Petit Verdot"),
  v("CHENIN", "Chenin"),
  v("RIESLING", "Riesling"),
  v("BLEND", "Blend"),
  // Estilos y otras palabras
  a("RVA", "Reserva"),
  a("G", "Gran"),
  a("ESP", "Espumante"),
  a("EX BRUT", "Extra Brut"),
  a("NAT", "Nature"),
  a("BCO", "Blanco"),
  a("TTO", "Tinto"),
  a("ROSE", "Rosé"),
  a("SV", "Single Vineyard"),
  a("ORG", "Orgánico"),
  a("COS TARDIA", "Cosecha Tardía"),
  a("TARDIA", "Tardía"),
  a("PEQ PROD", "Pequeñas Producciones"),
  a("GUALTA", "Gualtallary"),
  a("TERR", "Terroir"),
  a("CH", "Champagne"),
  a("PROY", "Proyecto"),
  a("DGO", "Domingo"),
  a("TUPUNG", "Tupungato"),
  a("MZA", "Mendoza"),
  a("APO", "Apelación"),
  a("ALT", "Altitud"),
  a("CALLEJ", "Callejón"),
  a("FCA", "Finca"),
  a("FLIA", "Familia"),
  a("FGLIA", "Famiglia"),
  a("STA", "Santa"),
  a("ST", "Saint"),
  a("ESC", "Escorihuela"),
  a("GASCON", "Gascón"),
  a("L BOSCA", "Luigi Bosca"),
  a("W", "Whisky"),
  a("AOVE", "AOVE"),
  a("DV", "DV"),
  a("IPA", "IPA"),
];

// Palabras que van en minúscula dentro del nombre.
const MINUSCULAS = new Set(["DE", "DEL", "Y"]);

function palabraLegible(palabra: string, primera: boolean): string {
  if (/^\d+(CC|ML)$/.test(palabra)) return `${palabra.slice(0, -2)} ${palabra.slice(-2).toLowerCase()}`;
  if (/^X\d+$/.test(palabra)) return palabra.toLowerCase();
  if (/\d/.test(palabra) || palabra.length === 1) return palabra;
  if (!primera && MINUSCULAS.has(palabra)) return palabra.toLowerCase();
  return palabra.charAt(0) + palabra.slice(1).toLowerCase();
}

/** Recorre la descripción reemplazando las abreviaturas más largas primero. */
function traducir(descripcion: string, diccionario: Abreviatura[]): { texto: string; varietal: boolean }[] {
  // "MAL-MER" son dos varietales: el guion se separa como una palabra más.
  const palabras = descripcion
    .trim()
    .toUpperCase()
    .replace(/(\S)-(\S)/g, "$1 - $2")
    .split(/\s+/)
    .filter(Boolean);
  const porTexto = new Map(diccionario.map((e) => [e.abreviatura.toUpperCase(), e]));
  const largo = Math.max(1, ...diccionario.map((e) => e.abreviatura.split(/\s+/).length));
  const partes: { texto: string; varietal: boolean }[] = [];
  for (let i = 0; i < palabras.length; ) {
    let encontrada: Abreviatura | undefined;
    let n = Math.min(largo, palabras.length - i);
    while (n > 0) {
      encontrada = porTexto.get(palabras.slice(i, i + n).join(" "));
      if (encontrada) break;
      n--;
    }
    if (encontrada) {
      partes.push({ texto: encontrada.expansion, varietal: encontrada.esVarietal });
      i += n;
    } else {
      partes.push({ texto: palabraLegible(palabras[i], i === 0), varietal: false });
      i++;
    }
  }
  return partes;
}

export function nombreLegible(descripcion: string, diccionario: Abreviatura[]): string {
  return traducir(descripcion, diccionario)
    .map((p) => p.texto)
    .join(" ");
}

/** Varietales reconocidos en la descripción, sin repetir ("Malbec, Pinot Noir"), o null. */
export function varietal(descripcion: string, diccionario: Abreviatura[]): string | null {
  const encontrados = [...new Set(traducir(descripcion, diccionario).filter((p) => p.varietal).map((p) => p.texto))];
  return encontrados.length > 0 ? encontrados.join(", ") : null;
}
