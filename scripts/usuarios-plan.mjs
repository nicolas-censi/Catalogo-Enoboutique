// Spec 012, CA-5: cómo pasar las cuentas con email a usuario. Funciones puras (con test).

// Tienen que coincidir con lib/admin/usuario.ts (lo verifica el test).
export const DOMINIO_INTERNO = "usuarios.enoboutique.invalid";
export const USUARIO = /^[a-z0-9._-]{3,30}$/;
/** @param {string} contrasena */
export const contrasenaInterna = (contrasena) => `${contrasena}::lehonor`;

/**
 * @param {{ id: string; email: string }[]} cuentas
 * @returns {{ cambios: { id: string; email: string; usuario: string }[]; problemas: string[] }}
 */
export function planearUsuarios(cuentas) {
  const yaPasadas = new Set(
    cuentas.filter((c) => c.email.toLowerCase().endsWith(`@${DOMINIO_INTERNO}`)).map((c) => c.email.split("@")[0].toLowerCase()),
  );
  const pendientes = cuentas
    .filter((c) => !c.email.toLowerCase().endsWith(`@${DOMINIO_INTERNO}`))
    .map((c) => ({ ...c, usuario: c.email.split("@")[0].toLowerCase() }));

  const problemas = [];
  const porUsuario = new Map();
  for (const c of pendientes) porUsuario.set(c.usuario, [...(porUsuario.get(c.usuario) ?? []), c.email]);
  for (const [usuario, emails] of porUsuario) {
    if (emails.length > 1) problemas.push(`${usuario}: lo usarían ${emails.join(" y ")}.`);
    else if (yaPasadas.has(usuario)) problemas.push(`${usuario}: ya existe y lo usaría ${emails[0]}.`);
  }
  for (const c of pendientes) {
    if (!USUARIO.test(c.usuario)) {
      problemas.push(`${c.email}: «${c.usuario}» no sirve como usuario (letras sin tildes, números, punto o guiones; de 3 a 30).`);
    }
  }
  return { cambios: problemas.length > 0 ? [] : pendientes, problemas };
}
