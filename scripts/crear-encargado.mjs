// Crea un encargado con usuario y contraseña (spec 012). Sirve para el primer encargado
// de un proyecto nuevo; los demás se dan de alta desde el panel.
//
// Uso: npm run db:encargado -- <usuario>   (la contraseña se pide al correr)
import { createInterface } from "node:readline/promises";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { DOMINIO_INTERNO, USUARIO, contrasenaInterna } from "./usuarios-plan.mjs";

nextEnv.loadEnvConfig(process.cwd());
const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: clave } = process.env;
if (!url || !clave) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (ver .env.example).");

const usuario = (process.argv[2] ?? "").trim().toLowerCase();
if (!USUARIO.test(usuario)) {
  console.error("Uso: npm run db:encargado -- <usuario> (de 3 a 30: letras sin tildes, números, punto o guiones)");
  process.exit(1);
}
const consola = createInterface({ input: process.stdin, output: process.stdout });
const contrasena = await consola.question("Contraseña (al menos 4 caracteres): ");
consola.close();
if (contrasena.length < 4 || contrasena.length > 60) {
  console.error("La contraseña tiene que tener entre 4 y 60 caracteres.");
  process.exit(1);
}

const admin = createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });
const { data, error } = await admin.auth.admin.createUser({
  email: `${usuario}@${DOMINIO_INTERNO}`,
  password: contrasenaInterna(contrasena),
  email_confirm: true,
});
if (error) {
  console.error(error.code === "email_exists" ? `Ya existe el usuario ${usuario}.` : error.message);
  process.exit(1);
}
const alta = await admin.from("personal").insert({ user_id: data.user.id, rol: "encargado" });
if (alta.error) {
  await admin.auth.admin.deleteUser(data.user.id);
  throw alta.error;
}
console.log(`Listo: ${usuario} es encargado y ya puede entrar al panel.`);
