// Spec 009: las tablas de datos de la app, en orden de dependencias (para copiar y
// restaurar: primero las que otras referencian).
export const TABLAS = [
  "secciones",
  "bodegas",
  "abreviaturas",
  "productos",
  "anadas",
  "codigos_barras",
  "importaciones",
  "marca",
  "promociones",
  "personal",
  "sugerencias",
  "ajustes_ia",
];

/**
 * Respalda cada tabla en un JSON (todas las filas). `sql` ejecuta una consulta y
 * devuelve filas; `guardar` escribe el archivo. Devuelve cuántas filas tiene cada una.
 * @param {(q: string) => Promise<any[]>} sql
 * @param {(tabla: string, filas: any[]) => void} guardar
 */
export async function respaldar(sql, guardar) {
  /** @type {Record<string, number>} */
  const cantidades = {};
  for (const tabla of TABLAS) {
    const [fila] = await sql(`select coalesce(json_agg(t), '[]'::json) as filas from public.${tabla} t`);
    const filas = fila?.filas ?? [];
    guardar(tabla, filas);
    cantidades[tabla] = filas.length;
  }
  return cantidades;
}
