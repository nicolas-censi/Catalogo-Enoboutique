// Usuarios del panel sin email (spec 012). Supabase Auth necesita un email por cuenta:
// el usuario se guarda como un email interno con el dominio reservado .invalid, que no
// existe y nunca recibe mails. Funciones puras: se usan en el servidor y en los tests.

const DOMINIO = "usuarios.enoboutique.invalid";
const USUARIO = /^[a-z0-9._-]{3,30}$/;
// Supabase exige contraseñas de al menos 6 caracteres; el panel permite 4. Se agrega
// siempre este sufijo en el servidor antes de mandarla a Supabase.
const SUFIJO = "::lehonor";
const MINIMO = 4;
// bcrypt (Supabase) usa hasta 72 bytes; con el sufijo y caracteres de varios bytes
// queda margen.
const MAXIMO = 60;

export const MENSAJES_USUARIO = {
  usuario: "El usuario tiene de 3 a 30 caracteres: letras sin tildes, números, punto, guion o guion bajo.",
  corta: `La contraseña tiene que tener al menos ${MINIMO} caracteres.`,
  larga: `La contraseña puede tener hasta ${MAXIMO} caracteres.`,
} as const;

export function validarUsuario(texto: string): { usuario: string } | { error: string } {
  const usuario = texto.trim().toLowerCase();
  return USUARIO.test(usuario) ? { usuario } : { error: MENSAJES_USUARIO.usuario };
}

export function validarContrasena(contrasena: string): string | null {
  if (contrasena.length < MINIMO) return MENSAJES_USUARIO.corta;
  if (contrasena.length > MAXIMO) return MENSAJES_USUARIO.larga;
  return null;
}

export const aEmailInterno = (usuario: string) => `${usuario}@${DOMINIO}`;

/** Usuario de una cuenta. Las cuentas viejas con email muestran lo que está antes de la @. */
export const deEmailInterno = (email: string) => email.split("@")[0];

export const contrasenaInterna = (contrasena: string) => `${contrasena}${SUFIJO}`;
