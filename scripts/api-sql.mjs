// Ejecuta SQL en el proyecto de Supabase por la API de administración (HTTPS).
// Lo usan los scripts de migraciones y seed, y los tests que necesitan SQL directo.
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

/**
 * @param {string} query
 * @returns {Promise<any[]>}
 */
export async function ejecutarSql(query) {
  const { SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF } = process.env;
  if (!SUPABASE_ACCESS_TOKEN || !SUPABASE_PROJECT_REF) {
    throw new Error("Faltan SUPABASE_ACCESS_TOKEN o SUPABASE_PROJECT_REF (ver .env.example).");
  }
  const respuesta = await fetch(
    `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );
  const cuerpo = await respuesta.text();
  if (!respuesta.ok) throw new Error(`Error ${respuesta.status}: ${cuerpo}`);
  return JSON.parse(cuerpo);
}
