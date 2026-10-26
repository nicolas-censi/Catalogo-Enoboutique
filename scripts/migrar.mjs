// Aplica las migraciones pendientes de supabase/migrations al proyecto de Supabase
// usando la API de administración (HTTPS). Sirve en entornos donde no hay conexión
// directa a Postgres. Registra cada migración en supabase_migrations.schema_migrations,
// igual que `supabase db push`, así que las dos formas se pueden combinar.
//
// Uso: npm run db:migrar   (requiere SUPABASE_ACCESS_TOKEN y SUPABASE_PROJECT_REF)
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ejecutarSql as sql } from "./api-sql.mjs";
import { migracionesPendientes } from "./migraciones.mjs";

/** @param {string} texto */
const literal = (texto) => `'${texto.replaceAll("'", "''")}'`;

await sql(`
  create schema if not exists supabase_migrations;
  create table if not exists supabase_migrations.schema_migrations (
    version text primary key,
    statements text[],
    name text
  );
`);

const aplicadas = (await sql("select version from supabase_migrations.schema_migrations")).map(
  (/** @type {{ version: string }} */ fila) => fila.version,
);
const carpeta = join(process.cwd(), "supabase", "migrations");
const archivos = readdirSync(carpeta).filter((archivo) => archivo.endsWith(".sql"));
const pendientes = migracionesPendientes(archivos, aplicadas);

if (pendientes.length === 0) {
  console.log("No hay migraciones pendientes.");
}

for (const migracion of pendientes) {
  const contenido = readFileSync(join(carpeta, migracion.archivo), "utf8");
  // Todo en una transacción: o se aplica la migración entera y queda registrada, o nada.
  await sql(`
    begin;
    ${contenido}
    ;
    insert into supabase_migrations.schema_migrations (version, statements, name)
    values (${literal(migracion.version)}, array[${literal(contenido)}], ${literal(migracion.nombre)});
    commit;
  `);
  console.log(`Aplicada: ${migracion.archivo}`);
}

if (pendientes.length > 0) {
  // Avisa a la API de Supabase (PostgREST) que recargue el esquema.
  await sql("notify pgrst, 'reload schema'");
}
