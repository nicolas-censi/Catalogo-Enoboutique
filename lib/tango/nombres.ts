// Nombres legibles a partir de las descripciones abreviadas de Tango (spec 008, CA-4).
// El diccionario se guarda en la base y lo edita el encargado; este es el inicial.

export type Abreviatura = { abreviatura: string; expansion: string; esVarietal: boolean };

const v = (abreviatura: string, expansion: string): Abreviatura => ({ abreviatura, expansion, esVarietal: true });
const a = (abreviatura: string, expansion: string): Abreviatura => ({ abreviatura, expansion, esVarietal: false });

// Lista armada por Lehonor (abreviaturas de las descripciones de Tango), más algunas
// que aparecen en el reporte y no estaban en la lista.
export const DICCIONARIO_INICIAL: Abreviatura[] = [
  a("ALT", "Altura"),
  a("ALTT", "Altitud"),
  a("AMATT", "Amaretto"),
  a("AMB", "Amber"),
  v("ANCELL", "Ancellota"),
  a("ANGOS", "Angostura"),
  a("AOVE", "Aceite de Oliva Virgen Extra"),
  a("AOVE VIR", "Viridian"),
  a("AOVE ZUC", "Aceite de Oliva Virgen Extra Zuccardi"),
  a("APO", "Apelación de Origen"),
  a("APTV", "Aperitivo"),
  a("ASSEM", "Assemblage"),
  a("AZF&HB", "Azafrán y Hierbas"),
  a("B DE BLANCAS", "Blend de Blancas"),
  a("B DE BLANCS", "Blanc de Blancs"),
  a("B DE NOIRS", "Blanc de Noirs"),
  a("B DE TINTAS", "Blend de Tintas"),
  a("BCO", "Blanco"),
  a("BD", "Blonde"),
  a("BIB", "Bag In Box"),
  a("BLD", "Blood"),
  a("BLEND DE EXT", "Blend de Extremos"),
  a("BNDY", "Brandy"),
  a("BNDY BARDNT", "Brandy Bardinet"),
  v("BON", "Bonarda"),
  a("BRUT NAT", "Brut Nature"),
  a("C", "Cava"),
  a("C BLANCAS", "Corte de Blancas"),
  a("C TINTAS", "Corte de Tintas"),
  v("CAB FRANC", "Cabernet Franc"),
  v("CAB SAUV", "Cabernet Sauvignon"),
  a("CAFAY", "Cafayate"),
  a("CALLEJ", "Callejón"),
  v("CARME", "Carménère"),
  a("CEA", "Casarena"),
  a("CH", "Champagne"),
  v("CHARDO", "Chardonnay"),
  a("CLAS", "Clásica"),
  a("COF", "Cofermentado"),
  a("COL", "Colección"),
  a("COLD S", "Cold Soil"),
  a("COS", "Cosecha"),
  a("CUV", "Cuvée"),
  a("D BOUSQ", "Domaine Bousquet"),
  a("D PAULA", "Doña Paula"),
  a("DB", "Double"),
  a("DOC", "Denominación de Origen Controlada"),
  a("E LOS CARDONES", "Estancia los Cardones"),
  a("ED", "Edición"),
  a("ESP", "Espumante"),
  a("EST", "Estuche"),
  a("ESTT", "Estate"),
  a("EX BRUT", "Extra Brut"),
  a("FABRE M", "Fabre Montmayou"),
  a("FCA", "Finca"),
  a("FDC", "Flor de Cardon"),
  a("FERM", "Fermentaciones"),
  a("FGLIA", "Famiglia"),
  a("FGO BCO", "Fuego Blanco"),
  a("FLIA", "Familia"),
  a("FLSC", "Falasco Wines"),
  a("FORTI", "Fortificado"),
  a("G", "Gran"),
  a("G RVA", "Gran Reserva"),
  a("GD", "Grand"),
  v("GEWURZ", "Gewürztraminer"),
  a("GIN HDERO", "Gin Heredero"),
  a("GLDN", "Golden"),
  a("GRAPEFR", "Grape Fruit"),
  v("GRUNER VELT", "Gruner Veltriner"),
  a("GRVL", "Gravel"),
  a("GTLMAN", "Gentelman"),
  a("GUALTA", "Gualtallary"),
  a("H CANALE", "Humberto Canale"),
  a("HARV", "Harvest"),
  a("HERIT", "Heritage"),
  a("HUE", "Huentala"),
  a("IG", "Indicación Geográfica"),
  a("IMP", "Imperial"),
  a("IP", "Indicación de Procedencia"),
  a("J RIVIER", "Jean Rivier"),
  a("J RUBIO", "Jorge Rubio"),
  a("J WALKER", "Johnnie Walker"),
  a("L", "Lata"),
  a("L BOSCA", "Luigi Bosca"),
  a("LAG", "Lager"),
  a("LCO", "La Colina de Oro"),
  a("LEG", "Leger"),
  a("LIC", "Licor"),
  a("LIEBR", "Colonia las Liebres"),
  a("LT", "Limitada"),
  a("M PELLERITI", "Marcelo Pelleriti"),
  a("MACERACION A", "Maceración Atenuada"),
  a("MACERACION P", "Maceración Prolongada"),
  v("MAL", "Malbec"),
  a("MALAB", "Malabarista"),
  a("MAX", "Máxima"),
  v("MER", "Merlot"),
  a("MICRO", "Microvinificaciones"),
  a("MILL", "Millésime"),
  a("MOET&CHA", "Moët & Chandon"),
  a("MOSQ", "Mosquita"),
  a("MUSSI", "Karim Mussi"),
  a("MZA", "Mendoza"),
  a("N CORREAS", "Navarrio Correas"),
  a("N SENET", "Nieto Senetiner"),
  a("NAT", "Nature"),
  a("NEPT", "Neptunia"),
  a("NVCNT", "Novecento"),
  a("ORG", "Orgánico"),
  a("P BORGES", "Penedo Borges"),
  v("P GRIGIO", "Pinot Grigio"),
  v("P NOIR", "Pinot Noir"),
  v("P VERDOT", "Petit Verdot"),
  v("P XIMENEZ", "Pedro Ximénez"),
  a("PAS", "Pasionado"),
  a("PEQ PROD", "Pequeñas Producciones"),
  a("PROS", "Prosecco"),
  a("PROY", "Proyecto"),
  a("PRTCLR", "Particular"),
  a("PTO", "Punto"),
  a("R", "Raíces"),
  a("R MALEN", "Ruca Malen"),
  a("ROY", "Royale"),
  a("RS", "Royal Salute"),
  a("RVA", "Reserva"),
  a("S ANDES", "Sur de los Andes"),
  a("S BALBO", "Susana Balbo"),
  a("S PABLO", "San Pablo"),
  a("SAL", "Salta"),
  v("SAUV BLANC", "Sauvignon Blanc"),
  a("SEL", "Selección"),
  v("SEM", "Semillón"),
  a("SEP", "Bodega Séptima"),
  a("SEV", "Sevilla"),
  a("SIG", "Signature"),
  a("SMNOFF", "Smirnoff"),
  a("SND", "Sand"),
  a("SPE", "Special"),
  a("ST ARTOIS", "Stella Artois"),
  a("STA", "Santa"),
  a("STONE S", "Stone Soil"),
  a("STRDV", "Stradivarius"),
  a("SV", "Single Vineyard"),
  v("TAN", "Tannat"),
  v("TEMPRA", "Tempranillo"),
  a("TERR", "Terroir"),
  a("TIGERS", "Tigerstone"),
  v("TORR", "Torrontés"),
  a("TRANS", "Transparente"),
  a("TTO", "Tinto"),
  a("TUNUY", "Tunuyán"),
  a("TUPU", "Tupungato"),
  a("V", "Vodka"),
  v("VIOG", "Viognier"),
  a("VLH", "Velho"),
  a("VMT", "Vermut"),
  a("VOM", "Vivo o Muerto"),
  a("VR", "Vera"),
  a("VS", "Very Special"),
  a("W", "Whisky"),
  a("WMKR", "Wine Maker"),
  a("YO", "Years Old"),
  a("DOM", "Domaine"),
  a("EDM", "Elena de Mendoza"),
  a("M.", "Magnum"),
  v("MALBEC", "Malbec"),
  v("CAB SAUVI", "Cabernet Sauvignon"),
  v("CS", "Cabernet Sauvignon"),
  v("CAB", "Cabernet"),
  v("CAB FRAN", "Cabernet Franc"),
  v("CF", "Cabernet Franc"),
  v("PINOT NOIR", "Pinot Noir"),
  v("SYRAH", "Syrah"),
  v("TANNAT", "Tannat"),
  v("CHENIN", "Chenin"),
  v("RIESLING", "Riesling"),
  v("BLEND", "Blend"),
  v("GEWURZT", "Gewürztraminer"),
  a("ROSE", "Rosé"),
  a("COS TARDIA", "Cosecha Tardía"),
  a("TARDIA", "Tardía"),
  a("TUPUNG", "Tupungato"),
  a("ESC", "Escorihuela"),
  a("GASCON", "Gascón"),
  a("ST", "Saint"),
  a("DGO", "Domingo"),
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
