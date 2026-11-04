// Spec 009, CA-7: copia de seguridad de todos los datos (el plan gratis de Supabase no
// hace copias automáticas). Deja un JSON por tabla en respaldos/AAAA-MM-DD/.
//
// Uso: npm run db:respaldo                 (producción: SUPABASE_PROJECT_REF_PRODUCCION)
//      node scripts/respaldo.mjs           (desarrollo)
// Solo lee: no hace falta confirmar.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ejecutarSql, proyecto } from "./api-sql.mjs";
import { respaldar } from "./tablas.mjs";

const fecha = new Date().toISOString().slice(0, 10);
const carpeta = join(process.cwd(), "respaldos", `${fecha}${proyecto.produccion ? "" : "-desarrollo"}`);
mkdirSync(carpeta, { recursive: true });
const cantidades = await respaldar(ejecutarSql, (tabla, filas) =>
  writeFileSync(join(carpeta, `${tabla}.json`), JSON.stringify(filas, null, 2)),
);
console.log(`Respaldo de ${proyecto.produccion ? "PRODUCCIÓN" : "desarrollo"} en ${carpeta}`);
for (const [tabla, n] of Object.entries(cantidades)) console.log(`  ${tabla}: ${n}`);
