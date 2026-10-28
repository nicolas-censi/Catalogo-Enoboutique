# 012 – Diseño técnico

## Cómo funciona sin email
Supabase Auth necesita un email por cuenta, así que el usuario se guarda como un
**email interno que nadie ve ni usa**: `<usuario>@usuarios.enoboutique.invalid`
(`.invalid` es un dominio reservado que no existe: nunca llega un mail). La app pasa
de usuario a email y de email a usuario en un solo lugar (`lib/admin/usuario.ts`).

**Contraseñas de 4 caracteres:** Supabase exige al menos 6. La contraseña que escribe
la persona se pasa siempre por la misma función en el servidor antes de mandarla a
Supabase (`contrasenaInterna(contrasena)`: le agrega un sufijo fijo). Así una
contraseña de 4 caracteres cumple el mínimo de Supabase. El ingreso pasa a una Server
Action para que esto ocurra en el servidor.
- Las cuentas existentes tienen la contraseña sin sufijo: al entrar, si la interna no
  sirve, se prueba la original y, si funciona, se actualiza a la interna (una sola vez,
  sin que la persona note nada).

## Datos
- Sin tablas nuevas. `personal` sigue igual; el usuario está en `auth.users.email`.
- Script `npm run db:usuarios` (una vez, CA-5): pasa cada cuenta del personal a
  `<antes de la @>@usuarios.enoboutique.invalid`; si hay repetidos, no cambia nada y
  los lista.

## Rutas y pantallas
| Ruta | Quién la usa | Cambio |
|------|--------------|--------|
| `/admin/ingresar` | personal | "Usuario" en vez de "Email"; sin "Olvidé mi contraseña" (CA-1, CA-3) |
| `/admin/personal` | encargado | alta con usuario, contraseña y rol; "Cambiar contraseña" por persona; lista con usuario (CA-2 a CA-4) |
| `/admin/olvide`, `/admin/restablecer` | — | se borran |

## Componentes y código
- `lib/admin/usuario.ts`: validar usuario, `aEmailInterno`, `deEmailInterno` y
  `contrasenaInterna` (funciones puras, con tests unitarios).
- `personal-servidor.ts`: `crearCuenta(usuario, contrasena)` (con `email_confirm`),
  `cambiarContrasena(id, contrasena)`, `cuentas()` devuelve el usuario. Se borran
  `invitar` y `buscarCuentaPorEmail`.
- `acciones-personal.ts`: `darDeAlta`, `cambiarContrasena` (solo encargado).
- Se borran `acciones-contrasena.ts`, `FormulariosContrasena.tsx`, las plantillas de
  mail, `scripts/configurar-mails.mjs`, `npm run db:mails` y `MAILS_DE_PRUEBA`.
- README: sin SMTP ni mails; cómo crear el primer encargado con usuario.

## Tests
- **Unit:** reglas del usuario, conversión usuario ↔ email interno, contraseña interna.
- **DB/servidor:** alta, usuario repetido, cambio de contraseña, cuenta vieja que se
  actualiza al entrar.
- **E2E:** ingreso con usuario (y en mayúsculas), error genérico, alta y la persona
  entra, cambio de contraseña (la vieja deja de servir), solo el encargado ve Personal,
  baja, accesibilidad y celular.

## Decisiones y alternativas descartadas
- **Email interno con `.invalid`** en vez de otro sistema de cuentas: se sigue usando
  Supabase Auth (sesiones, RLS, `auth.uid()`), sin cambiar nada de la base.
- **Sufijo fijo** para llegar al mínimo de Supabase en vez de bajar ese mínimo: el
  panel de Supabase no permite menos de 6.

## Riesgos
- Una contraseña de 4 caracteres se adivina más fácil. Lo mitiga el límite de intentos
  de Supabase por IP; bloquear por usuario queda como idea para más adelante.
- Si alguien crea cuentas a mano en Supabase, tiene que usar el email interno y la
  contraseña interna: el README lo explica (o mejor, crear el primer encargado con un
  script).
