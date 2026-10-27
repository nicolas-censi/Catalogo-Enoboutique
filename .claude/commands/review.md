---
description: Verifica lo implementado contra los criterios de aceptación de una spec
argument-hint: <carpeta-spec, ej. 001-modelo-datos>
---
Revisá la implementación de `specs/$ARGUMENTS/` contra sus criterios de aceptación.
**No modifiques código** en esta revisión: solo informá.

1. Leé `CLAUDE.md` y los tres archivos de `specs/$ARGUMENTS/`.
2. Corré `npm run test`, `npm run test:e2e`, `npm run test:e2e:produccion`, `npm run typecheck`
   y `npm run lint`,
   y reportá el resultado real de cada uno.
3. Armá una tabla con cada `CA-n`:
   | CA | Test(s) que lo cubren | Estado (✅ cumple / ⚠️ parcial / ❌ no cumple) | Nota |
4. Verificá además:
   - Que todas las tareas de `tasks.md` estén `[x]`.
   - Que no haya funcionalidades fuera de la spec.
   - Las reglas de `CLAUDE.md`: nada hardcodeado que deba ser editable desde el panel,
     solo tokens de marca, textos en español rioplatense con "vos", precios en ARS
     con `es-AR`, sin secretos en el código y diseño mobile-first.
5. Cerrá con un veredicto. Si todo cumple, proponé pasar `requirements.md` a
   **Implementada** y un mensaje de commit. Si no, listá qué falta, sin arreglarlo.
