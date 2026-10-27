import type { BrowserContext } from "@playwright/test";
import { crearUsuarioConSesion, type Rol } from "../db/ayudante";

/** Inicia sesión en el navegador del test como alguien del personal (o sin rol). */
export async function entrarComo(contexto: BrowserContext, rol?: Rol) {
  const sesion = await crearUsuarioConSesion(rol);
  const base = new URL("http://localhost:3100");
  await contexto.addCookies(
    sesion.cookies.map((c) => ({ ...c, domain: base.hostname, path: "/", sameSite: "Lax" as const })),
  );
  return sesion;
}
