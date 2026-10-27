// Configura en Supabase Auth las plantillas de mail en español y las direcciones a las
// que pueden llevar los enlaces. No toca el SMTP (eso se carga en el panel de Supabase,
// así la contraseña no pasa por acá). No imprime la respuesta (incluye secretos).
//
// Uso: npm run db:mails
import { readFileSync } from "node:fs";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
const { SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF } = process.env;

const plantilla = (nombre) => readFileSync(`supabase/plantillas/${nombre}.html`, "utf8");
const cambios = {
  site_url: "https://catalogo-enoboutique.vercel.app",
  uri_allow_list: [
    "http://localhost:3000/**",
    "http://localhost:3100/**",
    "https://catalogo-enoboutique.vercel.app/**",
    "https://*-urban-6740.vercel.app/**",
    "https://enoboutique.lehonor.com/**",
  ].join(","),
  mailer_subjects_recovery: "Elegí tu contraseña nueva · Lehonor Enoboutique",
  mailer_templates_recovery_content: plantilla("recuperar"),
  mailer_subjects_invite: "Te invitaron al panel · Lehonor Enoboutique",
  mailer_templates_invite_content: plantilla("invitacion"),
};

const respuesta = await fetch(`https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/config/auth`, {
  method: "PATCH",
  headers: { Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify(cambios),
});
if (respuesta.ok) console.log("Plantillas y direcciones configuradas.");
// Si falla, el cuerpo es solo el mensaje de error (sin la configuración).
else console.log(`Error ${respuesta.status}: ${(await respuesta.text()).slice(0, 300)}`);
process.exit(respuesta.ok ? 0 : 1);
