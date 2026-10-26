# 001 – Tareas

Cada tarea: máximo 30 minutos, verificable con un test, referenciada a un criterio (CA-n).

- [x] T1 — Crear el proyecto Next.js (App Router, TypeScript estricto, ESLint) con los
  scripts `dev`, `test`, `test:e2e`, `lint` y `typecheck`; fijar la versión de Node
  (`.nvmrc` y `engines`). (CA-1)
  Nota: `test` y `test:e2e` se agregan en la T2, junto con Vitest y Playwright.
- [x] T2 — Configurar Vitest y Playwright con un test e2e que abra `/` en un viewport
  de 390×844 y verifique que no hay errores en la consola. (CA-1)
- [x] T3 — Tokens de marca en Tailwind (`negro`, `fondo`, `dorado`) y tipografías
  Inknut Antiqua y Cabin con `next/font`; página provisoria que los usa; test que
  verifica los tokens y la tipografía aplicada. (CA-2)
- [ ] T4 — `formatearPrecio()` en `lib/formato.ts` y el texto "Consultar precio" en
  `lib/textos.ts`, con tests unitarios (47000 → `$ 47.000`, 0, millones, null →
  "Consultar precio"). (CA-11)
- [ ] T5 — Inicializar Supabase (`supabase init` + `supabase link` al proyecto de
  desarrollo), `.env.example`, clientes de Supabase en `lib/supabase/` y un helper de
  tests de base de datos (datos con prefijo único y limpieza, clientes `anon`, personal
  y no personal). (CA-1, CA-10)
- [ ] T6 — Migración: enums, `secciones`, `bodegas`, `productos` y el trigger
  `actualizado_en`; tests de inserción y de orden de secciones. (CA-9)
- [ ] T7 — Migración: `anadas`, con `codigo_tango` único, `unique (producto_id, anio)`
  y el check de `tipo`/`anio`; tests de cada restricción. (CA-4, CA-7)
- [ ] T8 — Trigger que valida que los productos que no son vino tengan una única
  presentación `sin_anada`; tests. (CA-6)
- [ ] T9 — Migración: `codigos_barras`; test de que un código no se repite entre
  productos. (CA-5)
- [ ] T10 — Migración: `personal`, `es_personal()` y políticas RLS en todas las tablas;
  tests como `anon`, personal y autenticado no personal. (CA-10)
- [ ] T11 — Vista `carta_publica` con las reglas de visibilidad; tests de cada regla
  (sin stock, sin precio que sí aparece, producto oculto, sección oculta, producto sin
  añadas visibles) y orden de añadas. (CA-3, CA-8, CA-9)
- [ ] T12 — Función `buscar_por_codigo_barras()`; tests: devuelve todas las añadas
  visibles del producto, y nada para un código inexistente o de un producto oculto.
  (CA-5)
- [ ] T13 — `seed.sql` con datos de ejemplo reales del export (Rutini Malbec con
  varias añadas, un destilado, un aceite, una sección oculta) para el proyecto de
  desarrollo, y generación de `lib/tipos-db.ts`; test de que el typecheck pasa con los
  tipos generados. (CA-1, CA-3)
- [ ] T14 — README con la puesta en marcha (requisitos, crear el proyecto de Supabase
  de desarrollo, `supabase link` y `db push`, `.env.local`, alta manual de personal) y
  verificación final de todos los comandos en verde. Documentar
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE` para usar un Chromium ya instalado. (CA-1)
