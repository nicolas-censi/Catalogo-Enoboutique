// Spec 009, T1: a qué proyecto de Supabase apuntan los scripts db:*. Por defecto, el de
// desarrollo (SUPABASE_PROJECT_REF). Con --produccion, el de producción
// (SUPABASE_PROJECT_REF_PRODUCCION), y solo si se confirma escribiendo "produccion".
// Los tests nunca usan producción: no leen esas variables.

/**
 * @param {{ argv: string[]; env: Record<string, string | undefined> }} entrada
 * @returns {{ ref: string; produccion: boolean }}
 */
export function elegirProyecto({ argv, env }) {
  const produccion = argv.includes("--produccion");
  if (!produccion) {
    if (!env.SUPABASE_PROJECT_REF) throw new Error("Falta SUPABASE_PROJECT_REF (ver .env.example).");
    return { ref: env.SUPABASE_PROJECT_REF, produccion: false };
  }
  if (!env.SUPABASE_PROJECT_REF_PRODUCCION) throw new Error("Falta SUPABASE_PROJECT_REF_PRODUCCION (ver .env.example).");
  if (env.SUPABASE_PROJECT_REF_PRODUCCION === env.SUPABASE_PROJECT_REF) {
    throw new Error("SUPABASE_PROJECT_REF_PRODUCCION es igual al de desarrollo: revisá las variables.");
  }
  return { ref: env.SUPABASE_PROJECT_REF_PRODUCCION, produccion: true };
}

/**
 * Pide confirmación para tocar producción: en una terminal, escribir "produccion"; sin
 * terminal (scripts automáticos), la variable CONFIRMAR_PRODUCCION=produccion.
 * @param {string} accion
 */
export async function confirmarProduccion(accion) {
  if (process.env.CONFIRMAR_PRODUCCION === "produccion") return;
  if (!process.stdin.isTTY) throw new Error(`Para ${accion} en PRODUCCIÓN hace falta CONFIRMAR_PRODUCCION=produccion.`);
  const { createInterface } = await import("node:readline/promises");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const respuesta = await rl.question(`Vas a ${accion} en PRODUCCIÓN. Escribí "produccion" para seguir: `);
  rl.close();
  if (respuesta.trim() !== "produccion") throw new Error("Cancelado.");
}
