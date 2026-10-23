# Cómo arrancar

1. Descomprimí esta carpeta, entrá a ella y ejecutá:
       git init
       git add . && git commit -m "Harness inicial"
       claude
2. Pegá este primer mensaje en Claude Code:

   > Leé CLAUDE.md y specs/000-vision.md. Revisá la visión y hacéme las preguntas
   > necesarias para completar los puntos marcados con ⚠️. No escribas código.

3. Cuando la visión esté completa y la marques como "Aprobada", corré:
       /spec modelo de datos Vino-Añadas y proyecto base Next.js + Supabase
4. Revisá la spec, aprobala y después:
       /implement 001-modelo-datos
   (repetir hasta completar todas las tareas)
5. Cerrá con:
       /review 001-modelo-datos
   Hacé commit, `/clear`, y pasá a la siguiente spec.
