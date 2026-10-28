// Spec 012, CA-5: pasa las cuentas del personal que entran con email a usuario (lo que
// está antes de la @). La contraseña no cambia: al primer ingreso se actualiza sola.
//
// Uso: npm run db:usuarios              (muestra qué haría, sin cambiar nada)
//      npm run db:usuarios -- --aplicar (hace los cambios)
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { DOMINIO_INTERNO, planearUsuarios } from "./usuarios-plan.mjs";

nextEnv.loadEnvConfig(process.cwd());
const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: clave } = process.env;
if (!url || !clave) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (ver .env.example).");
const admin = createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });
const aplicar = process.argv.includes("--aplicar");

const personal = await admin.from("personal").select("user_id");
if (personal.error) throw personal.error;
const ids = new Set(personal.data.map((p) => p.user_id));
const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
if (error) throw error;
const cuentas = data.users.filter((u) => ids.has(u.id)).map((u) => ({ id: u.id, email: u.email ?? "" }));

const { cambios, problemas } = planearUsuarios(cuentas);
if (problemas.length > 0) {
  console.log("No se cambió nada. Hay que resolver esto a mano en Supabase:");
  for (const p of problemas) console.log(`- ${p}`);
  process.exit(1);
}
if (cambios.length === 0) {
  console.log("Todas las cuentas del personal ya entran con usuario.");
  process.exit(0);
}
for (const c of cambios) {
  if (aplicar) {
    const r = await admin.auth.admin.updateUserById(c.id, { email: `${c.usuario}@${DOMINIO_INTERNO}`, email_confirm: true });
    if (r.error) throw r.error;
  }
  console.log(`${aplicar ? "Listo" : "Se cambiaría"}: ${c.email} → ${c.usuario}`);
}
if (!aplicar) console.log("\nPara hacer los cambios: npm run db:usuarios -- --aplicar");
