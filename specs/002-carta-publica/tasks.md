# 002 – Tareas

Cada tarea: máximo 30 minutos, verificable con un test, referenciada a un criterio (CA-n).

- [x] T1 — Migración: extensiones `pg_trgm` y `unaccent`, función de texto de búsqueda
  e índice de trigramas; tests de que el índice existe y la normalización saca tildes y
  mayúsculas. (CA-5)
- [x] T2 — Función `buscar_carta()`: búsqueda difusa por nombre, bodega y varietal,
  ordenada por relevancia; tests con errores de tipeo, tildes y partes del nombre.
  (CA-5)
- [ ] T3 — `buscar_carta()`: búsqueda por código de barras completo, textos cortos y
  productos no disponibles; tests. (CA-6, CA-8)
- [ ] T4 — `lib/carta.ts`: lectura de secciones, sección y producto agrupando filas por
  producto; etiquetas de añadas; tests unitarios y de base de datos. (CA-2, CA-3, CA-4)
- [ ] T5 — Encabezado con logo y página de inicio con secciones; e2e. (CA-1)
- [ ] T6 — Página de sección con tarjetas de producto y añadas; e2e. (CA-2, CA-4)
- [ ] T7 — Página de detalle y "No encontramos este producto"; e2e. (CA-3, CA-8)
- [ ] T8 — Página `/buscar` (sin JS) con resultados y mensaje sin resultados; e2e. (CA-5,
  CA-6, CA-7)
- [ ] T9 — Buscador con resultados mientras se escribe (debounce); e2e. (CA-5)
- [ ] T10 — Revalidación cada 60 segundos; test de que un cambio se ve después de
  revalidar. (CA-10)
- [ ] T11 — Red lenta: e2e con 3G simulado que verifica contenido sin JS y que el
  buscador no descarga la carta entera. (CA-9)
- [ ] T12 — Accesibilidad y tamaños tocables con `@axe-core/playwright`; ajustes de
  estilos con tokens. (CA-11)
