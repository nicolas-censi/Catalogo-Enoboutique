// Carga supabase/seed.sql (datos de ejemplo) en el proyecto de Supabase de desarrollo.
// Es idempotente: reemplaza los datos de ejemplo sin tocar el resto.
//
// Uso: npm run db:seed
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ejecutarSql } from "./api-sql.mjs";

await ejecutarSql(readFileSync(join(process.cwd(), "supabase", "seed.sql"), "utf8"));
console.log("Datos de ejemplo cargados.");
