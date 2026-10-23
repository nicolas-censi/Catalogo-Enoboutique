---
description: Implementa la siguiente tarea pendiente de una spec aprobada
argument-hint: <carpeta-spec, ej. 001-modelo-datos>
---
Implementá la **siguiente tarea pendiente** de `specs/$ARGUMENTS/tasks.md`.

1. Leé `CLAUDE.md`, `specs/000-vision.md` y los tres archivos de `specs/$ARGUMENTS/`.
2. Si `requirements.md` no está en estado **Aprobada**, frená y avisá. No implementes.
3. Tomá la **primera** tarea sin marcar (`- [ ]`). **Una sola tarea por vez.**
   Si es ambigua o choca con la spec, preguntá antes de escribir código.
4. **Test primero:** escribí los tests del `CA-n` que cubre la tarea (Vitest para
   lógica, Playwright para flujos de pantalla) y verificá que fallen.
5. Escribí el código mínimo para que pasen. Nada fuera de la spec: si surge una idea,
   anotala en "Ideas para más adelante" de `requirements.md`.
6. Respetá las reglas de código de `CLAUDE.md`: tokens de marca, textos en español
   rioplatense, ARS con `Intl.NumberFormat('es-AR')`, nada hardcodeado y secretos solo
   en `.env.local`.
7. Corré `npm run test`, `npm run typecheck` y `npm run lint`. Todo tiene que dar verde.
8. Marcá la tarea como `[x]` en `tasks.md`.
9. Mostrá qué cambió y qué quedó verificado, y **proponé** un mensaje de commit.
   No hagas commit hasta que te lo pidan. Después frená: la próxima tarea arranca con
   otro `/implement`.
