# 007 – Tareas

Cada tarea: máximo 30 minutos, verificable con un test, referenciada a un criterio (CA-n).

- [x] T1 — Migración: enum, tabla `sugerencias`, índice único, RLS, `tomar_cola`, bucket privado `sugerencias`; tests de DB (CA-6)
- [x] T2 — `lib/ia/`: interfaz `Sugeridor`, instrucciones, esquema de respuesta (Zod) y armado del pedido sin precios ni códigos; implementación falsa (`IA_FALSA=1`); unit (CA-4)
- [ ] T3 — Implementación real con `@google/genai` (Gemini 3.8 Flash, Google Search + URL context, fuentes de `groundingMetadata`, uso registrado) y prueba con 20 productos para medir calidad y costo real, comparando con 3.1 Pro (CA-1, CA-4, CA-7)
- [x] T4 — Foto: extracción de la imagen de la página, descarga segura, achicado con `sharp` y subida al bucket privado; unit de las guardas (CA-4, CA-6)
- [x] T5 — Acción `pedirSugerencia` + `BotonSugerir` en la ficha, con espera y error; e2e (CA-1)
- [x] T6 — `RevisarSugerencia` + acciones `aprobarSugerencia` / `descartarSugerencia`; e2e aprobar, solo foto, editar texto, descartar, se ve en la carta (CA-5, CA-6)
- [ ] T7 — Cola: acción `pedirSugerencias` (filtro "sin descripción o sin foto", tope de 1.000), `procesarCola` con tope diario y recuperación de `procesando` vencidas, ruta `/api/sugerencias/procesar` con `CRON_SECRET`; unit + DB (CA-2)
- [ ] T8 — Confirmación con cantidad y costo estimado (con búsquedas gratis del mes) en la lista de Productos; e2e (CA-2)
- [ ] T9 — Bandeja `/admin/sugerencias` con `ProcesadorCola`: listas / en cola / fallidas, volver a pedir, contador en el menú; e2e (CA-3)
- [ ] T10 — Costo del mes (`costo_sugerencias_mes`) en la bandeja; DB + e2e (CA-7)
- [ ] T11 — Accesibilidad (axe) y 390 px de ficha y bandeja; revisión contra los CA (todos)
