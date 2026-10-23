# Carta virtual – Vinoteca

## Qué es
Carta digital pública (se abre escaneando un QR en el local) + panel de administración
para el personal, que NO programa. Ver `specs/000-vision.md` antes de cualquier tarea.

## Regla de dominio clave
- Un **Vino** (etiqueta) tiene N **Añadas**. Cada añada tiene su propio precio y stock.
- El **código de barras pertenece al Vino**, NO es único por añada.
- Buscar o escanear un código devuelve el Vino con TODAS sus añadas visibles.

## Stack (no cambiar sin aprobación)
Next.js (App Router) + TypeScript estricto · Tailwind · Supabase (Postgres, Auth, Storage)
· dnd-kit (ordenamiento) · Vitest (unit) + Playwright (e2e) · Deploy en Vercel.

## Cómo trabajamos (spec-driven)
1. No se escribe código sin una spec aprobada en `/specs/NNN-nombre/`.
   Si la spec no existe o es ambigua: proponerla o preguntar. Nunca suponer.
2. Cada spec tiene `requirements.md` (QUÉ), `design.md` (CÓMO) y `tasks.md` (pasos).
3. Implementar UNA tarea de `tasks.md` por vez. Al terminarla, marcarla `[x]`.
4. Cada criterio de aceptación tiene al menos un test. Test primero, código después.
5. No agregar funcionalidades que no estén en la spec. Si surge una idea, anotarla
   en la sección "Ideas para más adelante" de la spec y seguir.
6. Al cerrar una tarea: tests y typecheck en verde, después proponer mensaje de commit.

## Reglas de código
- Todo dato visible en la carta debe ser editable desde el panel admin. Nada hardcodeado.
- Colores, tipografías y espaciados solo desde los tokens de marca (`tailwind.config`).
- Textos de la interfaz en español (rioplatense, tuteo con "vos").
- Precios en ARS, formateados con `Intl.NumberFormat('es-AR')`.
- Claves y secretos solo en `.env.local`. Nunca en el código ni en commits.
- Mobile-first: la carta se usa casi siempre desde el celular del cliente.

## Comandos
- `npm run dev` · `npm run test` · `npm run test:e2e` · `npm run lint` · `npm run typecheck`

## Comandos propios de Claude Code
- `/spec <funcionalidad>` → redacta una spec nueva (sin código)
- `/implement <carpeta-spec>` → implementa la siguiente tarea pendiente
- `/review <carpeta-spec>` → verifica lo hecho contra los criterios de aceptación
