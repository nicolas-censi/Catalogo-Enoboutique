# 007 – Tareas

Cada tarea: máximo 30 minutos, verificable con un test, referenciada a un criterio (CA-n).

- [ ] T1 — Migración: enum, tabla `sugerencias`, índice único, RLS y bucket privado `sugerencias`; tests de DB (CA-6)
- [ ] T2 — `lib/ia/`: interfaz `Sugeridor`, prompt, esquema de respuesta (Zod) y armado del pedido sin precios ni códigos; implementación falsa (`IA_FALSA=1`); unit (CA-4)
- [ ] T3 — Implementación real con el SDK (de a uno, streaming, búsqueda web, fallback) y prueba manual con 5 productos para medir costo real (CA-1, CA-4, CA-7)
- [ ] T4 — Descarga segura de la foto + achicado con `sharp` + subida al bucket privado; unit de las guardas (CA-4, CA-6)
- [ ] T5 — Acción `pedirSugerencia` + `BotonSugerir` en la ficha, con espera y error; e2e (CA-1)
- [ ] T6 — `RevisarSugerencia` + acciones `aprobarSugerencia` / `descartarSugerencia`; e2e aprobar, solo foto, editar texto, descartar, se ve en la carta (CA-5, CA-6)
- [ ] T7 — Lotes: `crearLote` / `leerLote` reales y falsos, acción `pedirSugerencias` con filtro "sin descripción o sin foto" y tope de 1.000; unit (CA-2)
- [ ] T8 — Confirmación con cantidad y costo estimado en la lista de Productos; e2e (CA-2)
- [ ] T9 — Bandeja `/admin/sugerencias`: recolección de lotes, listas / en camino / fallidas, volver a pedir, contador en el menú; e2e (CA-3)
- [ ] T10 — Costo del mes (`costo_sugerencias_mes`) en la bandeja; DB + e2e (CA-7)
- [ ] T11 — Accesibilidad (axe) y 390 px de ficha y bandeja; revisión contra los CA (todos)
