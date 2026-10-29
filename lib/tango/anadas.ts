// Añadas de los vinos de Tango (spec 008, CA-3). En Tango cada añada es un artículo y el
// año viene dentro de la descripción: los artículos de un mismo vino comparten la
// descripción sin el año (la "clave").
import type { ArticuloTango, TipoTango } from "@/lib/tango/reporte";

// Tamaños de botella: separan productos (un Magnum no es una añada del vino de 750 cc).
const TAMANO = /^(?:MAGNUM|DOBMAGNUM|DOBLE MAGNUM|JEROBOAM|IMPERIAL|\d{3,4}(?:CC|C|ML)?)$/;
// Palabras tras las que un número de dos cifras no es un año ("PARCELA 10").
const NO_ANIO = new Set(["CUARTEL", "PARCELA", "LOTE", "BLOCK", "CAP", "N", "NRO", "NUM", "PRUEBA", "BOX", "X"]);

export function separarAnada(descripcion: string, anioActual = new Date().getFullYear()): { clave: string; anio: number | null } {
  const texto = descripcion.trim().replace(/\s+/g, " ");
  const esAnio = (n: number) => n >= 1950 && n <= anioActual + 1;

  // Año al final: "RUTINI MAL 2020".
  let m = texto.match(/^(.+) ((?:19|20)\d\d)$/);
  if (m && esAnio(Number(m[2]))) return { clave: m[1], anio: Number(m[2]) };

  // Año antes del tamaño: "ZUCCARDI TITO BLEND 2014 MAGNUM".
  m = texto.match(/^(.+) ((?:19|20)\d\d) (.+)$/);
  if (m && esAnio(Number(m[2])) && TAMANO.test(m[3])) return { clave: `${m[1]} ${m[3]}`, anio: Number(m[2]) };

  // Año de dos cifras al final: "EL ENEMIGO BON 19".
  m = texto.match(/^(.+ )?(\S+) (\d\d)$/);
  if (m && !NO_ANIO.has(m[2])) {
    const anio = 2000 + Number(m[3]);
    if (esAnio(anio)) return { clave: `${m[1] ?? ""}${m[2]}`, anio };
  }

  return { clave: texto, anio: null };
}

export type ArticuloConAnio = ArticuloTango & { anio: number | null };
export type Grupo = { clave: string; tipo: TipoTango; articulos: ArticuloConAnio[]; problemas: string[] };

/**
 * Agrupa los artículos que se importan en productos: los vinos por su clave; los combos
 * y los demás tipos, uno por producto. Respeta el orden del archivo.
 */
export function agrupar(articulos: ArticuloTango[], anioActual?: number): Grupo[] {
  const grupos = new Map<string, Grupo>();
  for (const articulo of articulos) {
    if (!articulo.tipo) continue;
    const { clave, anio } =
      articulo.tipo === "vino" ? separarAnada(articulo.descripcion, anioActual) : { clave: articulo.codigo, anio: null };
    const id = `${articulo.tipo}:${clave}`;
    const grupo = grupos.get(id) ?? { clave, tipo: articulo.tipo, articulos: [], problemas: [] };
    // Un vino no repite año (spec 001): el segundo queda sin especificar, para revisar.
    const mismo = anio === null ? undefined : grupo.articulos.find((a) => a.anio === anio);
    if (mismo) grupo.problemas.push(`${articulo.codigo}: misma añada (${anio}) que ${mismo.codigo}; queda sin especificar.`);
    grupo.articulos.push({ ...articulo, anio: mismo ? null : anio });
    grupos.set(id, grupo);
  }
  return [...grupos.values()];
}
