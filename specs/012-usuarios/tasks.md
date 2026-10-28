# 012 – Tareas

Cada tarea: máximo 30 minutos, verificable con un test, referenciada a un criterio (CA-n).

- [x] T1 — `lib/admin/usuario.ts` (reglas, email interno, contraseña interna); tests
  unitarios. (CA-1, CA-2)
- [ ] T2 — Ingreso con usuario en una Server Action, error genérico y actualización de
  cuentas viejas; sin "Olvidé mi contraseña"; e2e. (CA-1, CA-3, CA-5)
- [ ] T3 — Alta de personal con usuario, contraseña y rol; usuario repetido; e2e en que
  la persona nueva entra. (CA-2)
- [ ] T4 — "Cambiar contraseña" del encargado; e2e (la vieja deja de servir). (CA-3)
- [ ] T5 — Lista y encabezado con el usuario; roles y bajas siguen andando; e2e. (CA-4)
- [ ] T6 — Script `db:usuarios` para las cuentas existentes y script para crear el
  primer encargado; test. (CA-5)
- [ ] T7 — Borrar lo de mails (pantallas, plantillas, script, `MAILS_DE_PRUEBA`) y
  actualizar README; accesibilidad y celular. (CA-3, CA-4)
