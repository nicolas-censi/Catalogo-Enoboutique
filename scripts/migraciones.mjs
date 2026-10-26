// Lógica pura de migraciones, compartida por scripts/migrar.mjs y sus tests.

/** @param {string} archivo */
export function versionDeArchivo(archivo) {
  const coincidencia = /^(\d{14})_(.+)\.sql$/.exec(archivo);
  if (!coincidencia) {
    throw new Error(`Nombre de migración inválido: ${archivo} (se espera AAAAMMDDHHMMSS_nombre.sql)`);
  }
  return { version: coincidencia[1], nombre: coincidencia[2] };
}

/**
 * @param {string[]} archivos
 * @param {string[]} aplicadas
 */
export function migracionesPendientes(archivos, aplicadas) {
  const yaAplicadas = new Set(aplicadas);
  return archivos
    .map((archivo) => ({ archivo, ...versionDeArchivo(archivo) }))
    .filter((migracion) => !yaAplicadas.has(migracion.version))
    .sort((a, b) => a.version.localeCompare(b.version));
}
