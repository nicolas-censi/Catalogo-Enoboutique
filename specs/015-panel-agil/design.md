# 015 – Diseño técnico

## Pantallazo negro y carga (CA-1, CA-2)
- Causa: cada página arma `ConSesion` → `MarcoPanel` (tema claro y menú) dentro de su
  propio `<Suspense fallback={null}>`. Mientras carga se ve el `body` de la carta
  (negro) y el menú se desmonta y vuelve a montar en cada navegación.
- `app/admin/layout.tsx` pasa a tener el marco: `<div class="tema-panel">` siempre
  (así el fondo nunca es negro) y, con sesión, el menú (`NavPanel`) — el layout no se
  vuelve a renderizar al navegar, así que el menú queda fijo. La pantalla de ingreso y
  "No tenés acceso" se muestran sin menú.
- Las páginas dejan de usar `MarcoPanel`; `ConSesion` solo verifica el acceso (y
  `soloEncargado`) y devuelve el contenido.
- El `fallback` de los Suspense de las páginas (y del layout) es `<Cargando />`, un
  indicador circular animado con "Cargando…" (`role="status"`), sin animación con
  `prefers-reduced-motion`. Se probó además un `app/admin/loading.tsx` y se descartó:
  retrasaba el contenido (llegaba en un segundo envío) sin mejorar lo que se ve.
- `NavPanel` marca la opción tocada al instante (`useLinkStatus` / estado optimista).

## IA en segundo plano (CA-3)
- Causa: `pedirSugerencia` espera a Gemini dentro de la Server Action y Next.js ejecuta
  las acciones de un cliente de a una.
- `pedirSugerencia` crea la sugerencia en `procesando`, devuelve enseguida y la resuelve
  con `after()` (`next/server`: sigue después de responder, hasta `maxDuration`).
- La cola deja de procesarse con una Server Action: `ProcesadorCola` pasa al layout
  (todas las pantallas) y llama por `fetch` a `POST /api/sugerencias/tanda` (sesión del
  personal; los `fetch` no bloquean las acciones). La ruta del cron no cambia.

## Aviso y contador (CA-4)
- `GET /api/sugerencias/estado` (sesión del personal): cantidad de listas, en cola y
  procesando, y las sugerencias listas o fallidas desde un momento dado
  (`?desde=<iso>`) con el nombre del producto.
- `ActividadIA` (cliente, en el layout): consulta cada 5 s mientras haya en cola o
  procesando (y cada 60 s si no; enseguida al pedir una), toma el corte de tiempo al
  empezar la consulta y descarta avisos repetidos; si una tanda de la cola no avanzó
  (tope del día o pedidos que no se pueden tomar) espera al próximo turno (nunca en
  bucle); actualiza el contador del menú y muestra los avisos
  (`role="status"`, se cierran solos a los 10 s o con **Cerrar**; enlace **Revisar** a la
  ficha con `?revisar=1` o a **Para revisar** si son varias). `router.refresh()` cuando
  llega algo, para que la pantalla actual se actualice.

## Tests
- E2E: sin fondo negro durante la navegación (color del fondo mientras carga), menú
  presente al navegar, indicador de carga; pedir sugerencia y navegar enseguida a otra
  pantalla y guardar algo sin esperar; aviso que aparece en otra pantalla y contador que
  sube solo; cola avanzando desde Productos. Accesibilidad.
