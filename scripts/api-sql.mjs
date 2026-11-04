// Ejecuta SQL en el proyecto de Supabase por la API de administración (HTTPS).
// Lo usan los scripts de migraciones y seed, y los tests que necesitan SQL directo.
import nextEnv from "@next/env";
import { elegirProyecto } from "./proyecto.mjs";

nextEnv.loadEnvConfig(process.cwd());

/** Proyecto al que apunta este script (desarrollo, o producción con --produccion). */
export const proyecto = elegirProyecto({ argv: process.argv, env: process.env });

/**
 * @param {string} query
 * @returns {Promise<any[]>}
 */
export async function ejecutarSql(query) {
  const { SUPABASE_ACCESS_TOKEN } = process.env;
  if (!SUPABASE_ACCESS_TOKEN) throw new Error("Falta SUPABASE_ACCESS_TOKEN (ver .env.example).");
  const respuesta = await fetch(
    `https://api.supabase.com/v1/projects/${proyecto.ref}/database/query`,
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
