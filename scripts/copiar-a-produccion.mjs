// Spec 009, T3 (CA-2): copia los datos de desarrollo a producción, una sola vez, con
// confirmación. Lee de SUPABASE_PROJECT_REF y escribe en SUPABASE_PROJECT_REF_PRODUCCION
// por la API de administración. No copia nada creado por los tests. Al final compara
// las cantidades.
//
// Uso: node scripts/copiar-a-produccion.mjs --produccion
//      node scripts/copiar-a-produccion.mjs --simulacro   (solo lee desarrollo y muestra qué copiaría)
import nextEnv from "@next/env";
import { ejecutarSqlEn, proyecto } from "./api-sql.mjs";
import { enTandas, esDePrueba, literal, planCopia, TABLAS_A_COPIAR } from "./copia-plan.mjs";
import { confirmarProduccion } from "./proyecto.mjs";

nextEnv.loadEnvConfig(process.cwd());
const dev = process.env.SUPABASE_PROJECT_REF;
const leerDe = async (ref, tabla, donde = "") =>
  (await ejecutarSqlEn(ref, `select coalesce(json_agg(t), '[]'::json) as filas from ${tabla} t ${donde}`))[0].filas;

if (process.argv.includes("--simulacro")) {
  const personal = await leerDe(dev, "public.personal");
  const usuarios = personal.length
    ? (await leerDe(dev, "auth.users", `where id in (${personal.map((p) => literal(p.user_id)).join(", ")})`)).filter((u) => !esDePrueba(u) && !/^test-/.test(u.email ?? ""))
    : [];
  const datos = {};
  for (const tabla of TABLAS_A_COPIAR) datos[tabla] = await leerDe(dev, `public.${tabla}`);
  const plan = planCopia(datos, new Set(usuarios.map((u) => u.id)));
  console.log(`Simulacro (no escribe nada). Usuarios: ${usuarios.length}`);
  for (const tabla of TABLAS_A_COPIAR) console.log(`  ${tabla}: ${plan[tabla].length} de ${datos[tabla].length}`);
  process.exit(0);
}
if (!proyecto.produccion) throw new Error("Usá --produccion: este script escribe en producción.");
const prod = proyecto.ref;
await confirmarProduccion("copiar los datos de desarrollo");

const enDev = (q) => ejecutarSqlEn(dev, q);
const enProd = (q) => ejecutarSqlEn(prod, q);
const leer = async (ejecutar, tabla, donde = "") => leerDe(ejecutar === enDev ? dev : prod, tabla, donde);

// 0. Producción tiene que estar vacía (con las migraciones aplicadas).
const [{ n }] = await enProd("select count(*)::int as n from public.productos");
if (n > 0 && !process.argv.includes("--forzar")) throw new Error(`Producción ya tiene ${n} productos: no copio encima (usá --forzar si es a propósito).`);

/** Columnas que se pueden insertar (sin las generadas). */
async function columnas(esquema, tabla) {
  const filas = await enProd(
    `select column_name from information_schema.columns where table_schema = ${literal(esquema)} and table_name = ${literal(tabla)} and is_generated = 'NEVER' and generation_expression is null order by ordinal_position`,
  );
  return filas.map((f) => `"${f.column_name}"`).join(", ");
}

async function insertar(esquema, tabla, filas) {
  if (filas.length === 0) return;
  const cols = await columnas(esquema, tabla);
  for (const tanda of enTandas(filas)) {
    await enProd(`insert into ${esquema}.${tabla} (${cols}) select ${cols} from json_populate_recordset(null::${esquema}.${tabla}, ${literal(JSON.stringify(tanda))})`);
  }
}

// 0b. Destino limpio: las migraciones cargan bodegas y abreviaturas de Tango (que se
// reemplazan por las de desarrollo, que el personal pudo haber corregido) y, si una
// copia anterior se cortó, quedan restos. Producción no tiene productos todavía.
for (const tabla of [...TABLAS_A_COPIAR].reverse()) await enProd(`delete from public.${tabla}`);

// 1. Usuarios del personal (no los de los tests), con el hash de la contraseña.
const personal = await leer(enDev, "public.personal");
const ids = personal.map((p) => p.user_id);
const usuarios = ids.length
  ? (await leer(enDev, "auth.users", `where id in (${ids.map(literal).join(", ")})`)).filter((u) => !esDePrueba(u) && !/^test-/.test(u.email ?? ""))
  : [];
const reales = new Set(usuarios.map((u) => u.id));
const identidades = reales.size ? await leer(enDev, "auth.identities", `where user_id in (${[...reales].map(literal).join(", ")})`) : [];
if (reales.size) await enProd(`delete from auth.users where id in (${[...reales].map(literal).join(", ")})`);
await insertar("auth", "users", usuarios);
await insertar("auth", "identities", identidades);
console.log(`Usuarios: ${usuarios.length}`);

// 2. Datos, en orden de dependencias.
const datos = {};
for (const tabla of TABLAS_A_COPIAR) datos[tabla] = await leer(enDev, `public.${tabla}`);
const plan = planCopia(datos, reales);
for (const tabla of TABLAS_A_COPIAR) {
  await insertar("public", tabla, plan[tabla]);
  console.log(`${tabla}: ${plan[tabla].length}`);
}

// 3. Archivos que usan esas filas (fotos, logo, promociones, fotos sugeridas).
const claves = {
  dev: process.env.SUPABASE_SERVICE_ROLE_KEY,
  prod: await claveServicio(prod),
};
async function claveServicio(ref) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys?reveal=true`, { headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}` } });
  if (!r.ok) throw new Error(`No pude leer las claves de producción (${r.status}).`);
  const lista = await r.json();
  const k = lista.find((x) => x.name === "service_role" || x.type === "secret");
  if (!k?.api_key) throw new Error("No encontré la clave de servicio de producción.");
  return k.api_key;
}
const archivos = [
  ...plan.productos.filter((p) => p.foto_path).map((p) => ["fotos", p.foto_path]),
  ...plan.marca.filter((m) => m.logo_path).map((m) => ["marca", m.logo_path]),
  ...plan.promociones.map((p) => ["promociones", p.imagen_path]),
  ...plan.sugerencias.filter((s) => s.foto_path).map((s) => ["sugerencias", s.foto_path]),
];
let copiados = 0;
for (const [bucket, ruta] of archivos) {
  const bajada = await fetch(`https://${dev}.supabase.co/storage/v1/object/${bucket}/${ruta}`, { headers: { Authorization: `Bearer ${claves.dev}`, apikey: claves.dev } });
  if (!bajada.ok) {
    console.warn(`  No se pudo bajar ${bucket}/${ruta} (${bajada.status})`);
    continue;
  }
  const subida = await fetch(`https://${prod}.supabase.co/storage/v1/object/${bucket}/${ruta}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${claves.prod}`, apikey: claves.prod, "content-type": bajada.headers.get("content-type") ?? "application/octet-stream", "x-upsert": "true" },
    body: Buffer.from(await bajada.arrayBuffer()),
  });
  if (subida.ok) copiados++;
  else console.warn(`  No se pudo subir ${bucket}/${ruta} (${subida.status})`);
}
console.log(`Archivos: ${copiados} de ${archivos.length}`);

// 4. Verificación: producción tiene lo que se planeó copiar.
let bien = true;
for (const tabla of TABLAS_A_COPIAR) {
  const [{ n: cuantos }] = await enProd(`select count(*)::int as n from public.${tabla}`);
  const ok = cuantos === plan[tabla].length;
  bien &&= ok;
  console.log(`${ok ? "✓" : "✗"} ${tabla}: ${cuantos} (se esperaban ${plan[tabla].length})`);
}
await enProd("notify pgrst, 'reload schema'");
if (!bien || copiados !== archivos.length) {
  process.exitCode = 1;
  console.error("La copia no coincide: revisar antes de usar producción.");
} else console.log("Copia completa y verificada.");
