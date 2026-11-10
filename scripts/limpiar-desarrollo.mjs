// Spec 009, T8 (CA-2): deja la base de DESARROLLO solo con los datos de ejemplo
// (supabase/seed.sql), una vez que los datos reales están en producción. Antes conviene
// correr `node scripts/respaldo.mjs` (copia de desarrollo).
//
// Uso: node scripts/limpiar-desarrollo.mjs
// Se niega a correr contra producción.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ejecutarSql, proyecto } from "./api-sql.mjs";

if (proyecto.produccion) throw new Error("Este script es solo para desarrollo.");
const EJEMPLO = "'5eed0000-0000-4000-8000-%'";

await ejecutarSql(`
  begin;
  delete from public.sugerencias;
  delete from public.promociones;
  update public.marca set bienvenida = null, logo_path = null;
  delete from public.importaciones;
  delete from public.productos where id::text not like ${EJEMPLO};
  delete from public.secciones where seccion_padre_id is not null and id::text not like ${EJEMPLO};
  delete from public.secciones where id::text not like ${EJEMPLO};
  delete from public.bodegas b where not exists (select 1 from public.productos p where p.bodega_id = b.id);
  update public.ajustes_ia set activa = false;
  commit;
`);
// Los datos de ejemplo, como recién cargados.
await ejecutarSql(readFileSync(join(process.cwd(), "supabase", "seed.sql"), "utf8"));

// Archivos que ya no usa ninguna fila (fotos de productos borrados, logo, promociones,
// fotos sugeridas).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cabeceras = { Authorization: `Bearer ${clave}`, apikey: clave, "content-type": "application/json" };
const fotosEnUso = new Set((await ejecutarSql("select foto_path from public.productos where foto_path is not null")).map((f) => f.foto_path));

async function listar(bucket, prefijo = "") {
  const r = await fetch(`${url}/storage/v1/object/list/${bucket}`, { method: "POST", headers: cabeceras, body: JSON.stringify({ prefix: prefijo, limit: 1000 }) });
  const items = r.ok ? await r.json() : [];
  const rutas = [];
  for (const it of items) {
    const ruta = prefijo ? `${prefijo}/${it.name}` : it.name;
    if (it.id === null) rutas.push(...(await listar(bucket, ruta)));
    else rutas.push(ruta);
  }
  return rutas;
}

for (const bucket of ["fotos", "marca", "promociones", "sugerencias"]) {
  const rutas = (await listar(bucket)).filter((r) => !(bucket === "fotos" && fotosEnUso.has(r)));
  for (let i = 0; i < rutas.length; i += 100) {
    await fetch(`${url}/storage/v1/object/${bucket}`, { method: "DELETE", headers: cabeceras, body: JSON.stringify({ prefixes: rutas.slice(i, i + 100) }) });
  }
  console.log(`${bucket}: ${rutas.length} archivos borrados`);
}

for (const tabla of ["secciones", "bodegas", "productos", "anadas", "codigos_barras", "promociones", "sugerencias"]) {
  const [{ n }] = await ejecutarSql(`select count(*)::int as n from public.${tabla}`);
  console.log(`${tabla}: ${n}`);
}
