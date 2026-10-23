---
description: Redacta una spec nueva (requirements, design, tasks) sin escribir código
argument-hint: <funcionalidad>
---
Redactá una spec nueva para: **$ARGUMENTS**

**No escribas código de la aplicación.** Solo documentos en `specs/`.

1. Leé `CLAUDE.md` y `specs/000-vision.md`. Si la visión no está "Aprobada", frená y avisá.
2. Revisá las specs existentes en `specs/` para no duplicar ni contradecir nada.
   Elegí el siguiente número libre (`001`, `002`…) y un nombre corto en kebab-case:
   `specs/NNN-nombre/`.
3. Copiá la estructura de `specs/_plantilla/` y completá:
   - `requirements.md` (QUÉ): objetivo, historias de usuario, criterios de aceptación
     **Dado / Cuando / Entonces** numerados `CA-n`, fuera de alcance, preguntas abiertas.
     Estado: **Borrador**.
   - `design.md` (CÓMO): datos, rutas y pantallas, componentes, decisiones y riesgos,
     respetando el stack de `CLAUDE.md`.
   - `tasks.md`: tareas de máximo 30 minutos, cada una verificable con un test y
     referenciada a un `CA-n`. Todo `CA-n` tiene que estar cubierto por al menos una tarea.
4. Limitate a lo que pide la funcionalidad y la visión. Lo que sobre va en
   "Ideas para más adelante".
5. **Nunca supongas.** Lo ambiguo va a "Preguntas abiertas" con `- [ ]`.
6. Al terminar, mostrá un resumen corto (criterios y tareas) y las preguntas abiertas,
   y pedí revisión. La spec pasa a "Aprobada" solo cuando la persona lo confirma.
