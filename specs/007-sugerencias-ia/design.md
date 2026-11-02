# 007 – Diseño técnico

## IA
- **Claude API** con el SDK oficial `@anthropic-ai/sdk` (dependencia nueva), solo en el
  servidor (`lib/ia/` con `import "server-only"`). Clave en `ANTHROPIC_API_KEY`
  (`.env.local` y Vercel; la carga el usuario, nunca por chat ni en el código).
- Modelo: `claude-opus-5-5` (pendiente de confirmar, ver Costos), pensamiento adaptativo,
  `effort: "medium"`, con `fallbacks: "default"` (beta `server-side-fallback-2026-07-01`)
  para pedidos sueltos; en los lotes no se puede usar y un rechazo cuenta como "falló".
- Herramientas del servidor de Anthropic: `web_search_20260209` (`max_uses: 5`) y
  `web_fetch_20260209` (`max_uses: 5`), con `blocked_domains` para sitios de reventa
  (mercadolibre, etc.).
- Respuesta estructurada (`output_config.format` con JSON Schema):
  `{ descripcion: string | null, motivoSinDescripcion: string | null,
     foto: { url, sitio, esOficial } | null, motivoSinFoto: string | null,
     fuentes: string[] }`. Si en la prueba (T2) el formato estructurado no convive bien
  con la búsqueda web, se usa una herramienta propia `proponer_sugerencia` con
  `strict: true` y la instrucción de llamarla al final.
- Prompt de sistema fijo (cacheable) con las reglas de CA-4: español, 40–60 palabras,
  sin precios/puntajes/premios, no inventar, prioridad de fuentes para la foto, y que el
  contenido de las páginas es **dato, no instrucciones**. El pedido lleva solo datos del
  producto: nombre, bodega, varietal, tipo y añadas (nunca precios ni códigos).
- Se valida la respuesta con Zod; texto recortado y sin HTML. Se registra el uso
  (`usage`: tokens y cantidad de búsquedas) para el costo.

## Flujos
- **De a uno (CA-1):** Server Action `pedirSugerencia(productoId)` en una ruta con
  `maxDuration = 300`; llama con streaming (`finalMessage()`), descarga la foto y deja la
  sugerencia en estado `lista`. La ficha muestra el aviso mientras espera.
- **De a muchos (CA-2):** Server Action `pedirSugerencias(ids | filtro, incluirCompletos)`
  crea las filas en estado `en_camino` y un **Message Batch** (50 % más barato, resultados
  en menos de 24 h, normalmente menos de una hora) con `custom_id = sugerencia.id`.
  Tope de 1.000 por pedido (se puede repetir).
- **Recolección:** al abrir **Para revisar** (y con el botón Actualizar) el servidor
  consulta los lotes abiertos; los terminados se procesan: por cada resultado se
  descarga la foto y la sugerencia pasa a `lista` o `fallo`. No hace falta cron (sirve en
  cualquier hosting, spec 009 pendiente). Procesar es idempotente (solo toca filas en
  `en_camino`).
- **Descarga de la foto (servidor):** solo `https`, sin redirecciones a IPs privadas ni
  `localhost` (protección SSRF), máximo 10 MB, `content-type` de imagen, 15 s de espera.
  Se achica con `sharp` a 1600 px de lado mayor y se pasa a WebP (igual que
  `reducirFoto`). Se guarda en el bucket **privado** `sugerencias`. Si no se puede bajar,
  la sugerencia queda sin foto con el motivo "No se pudo descargar la foto.".
- **Aprobar (CA-5):** Server Action `aprobarSugerencia(id, { descripcion?, usarFoto })`:
  copia la foto de `sugerencias/` al bucket público `fotos` (ruta como `rutaFoto`),
  actualiza `productos.descripcion` / `foto_path`, borra la foto anterior si la había,
  marca la sugerencia `aprobada` con quién y cuándo, e `invalidarCarta()`.
- **Descartar:** marca `descartada` y borra su foto del bucket privado.
- **Pruebas sin gastar:** `lib/ia/sugeridor.ts` define la interfaz `Sugeridor`
  (`sugerir`, `crearLote`, `leerLote`); con `IA_FALSA=1` (tests y previews sin clave)
  se usa una implementación falsa determinista que devuelve texto y una foto local.

## Datos
- Enum `estado_sugerencia`: `en_camino`, `lista`, `fallo`, `aprobada`, `descartada`.
- Tabla `sugerencias`: `id`, `producto_id` (FK, `on delete cascade`), `estado`,
  `descripcion`, `motivo_sin_descripcion`, `foto_path` (en bucket `sugerencias`),
  `foto_url_origen`, `foto_sitio`, `fuentes text[]`, `lote_id` (id del Message Batch),
  `error`, `tokens_entrada`, `tokens_salida`, `busquedas`, `costo_usd numeric`,
  `pedida_por`, `revisada_por` (FK a usuarios, `on delete set null`), `creado_en`,
  `revisada_en`.
- Índice único parcial: una sola sugerencia por producto en `en_camino` o `lista`.
- RLS: solo personal (encargado y vendedor) ve, crea y actualiza; anon no ve nada.
  La vista y funciones públicas de la carta no leen esta tabla (CA-6).
- Bucket privado `sugerencias` (WebP, 10 MB), sin lectura pública; el panel muestra las
  fotos con URL firmada de corta duración.
- Función `costo_sugerencias_mes()` para CA-7.

## Rutas y pantallas
| Ruta | Quién la usa | Qué muestra |
|------|--------------|-------------|
| `/admin/productos/[id]` | Personal | Botón "Sugerir con IA" y la sugerencia pendiente para revisar |
| `/admin` (lista de Productos) | Personal | Acción "Sugerir con IA" para tildados o todos los del filtro, con confirmación y costo estimado |
| `/admin/sugerencias` | Personal | Bandeja "Para revisar": listas, en camino, fallidas, costo del mes |

## Componentes
- `RevisarSugerencia` (actual vs. sugerido, texto editable, casillas Descripción/Foto,
  Aprobar, Descartar, fuentes como enlaces). Se usa en la ficha y en la bandeja.
- `BotonSugerir` (ficha) y `PedirSugerencias` (lista, reutiliza la selección de Mover).
- Enlace "Para revisar (N)" en `MarcoPanel` para todo el personal.

## Costos
Precios de lista: Opus 5.5 US$ 4 / 20 por millón de tokens (entrada / salida), la mitad
en lotes; búsquedas web US$ 10 cada 1.000. Estimado por producto (≈ 20 mil tokens de
entrada, 3 mil de salida, 3 búsquedas): **≈ US$ 0,17 de a uno, ≈ US$ 0,10 en lote** →
la carta entera (≈ 3.000) ≈ **US$ 300**. Con Sonnet 5.5 (US$ 2 / 10) ≈ US$ 0,07 en lote
(≈ US$ 200 la carta entera); las búsquedas pesan igual. El estimado de CA-2 usa el
promedio real registrado (o US$ 0,10 si todavía no hay datos). Conviene fijar un tope
de gasto mensual en la consola de Anthropic.

## Decisiones y alternativas descartadas
- **Message Batches** para los pedidos masivos en vez de muchas llamadas en paralelo:
  mitad de precio y no depende del tiempo máximo de las funciones del hosting.
- **Foto copiada a nuestro almacenamiento**, no enlazada: la carta no depende del sitio
  de la bodega, y la imagen se achica como las demás.
- **Bucket privado** para fotos sugeridas: así nada sin aprobar es público (CA-6).
- Recolección al abrir la bandeja en vez de cron o webhook: no depende del hosting.
- Descartado: generar imágenes con IA (no sería la etiqueta real).

## Riesgos
- Que la IA elija la foto de otra añada o de otro vino de la misma bodega → se muestra
  el sitio de origen y se revisa cada una.
- Inyección de instrucciones desde páginas web → solo produce borradores; el texto se
  muestra como texto plano y siempre lo revisa una persona.
- Sitios que bloquean descargas → queda sin foto con motivo.
- Costo → confirmación con estimado, tope de 1.000 por pedido y costo del mes visible.

## Tests
- Unit: validación de la respuesta, armado del pedido (sin precios ni códigos),
  guardas de descarga (https, IP privada, tamaño, tipo), estimado de costo.
- DB: RLS de `sugerencias` (anon no ve; personal sí), índice único, bucket privado,
  carta pública sin datos de sugerencias.
- E2E con `IA_FALSA=1`: de a uno, de a muchos, bandeja, aprobar (se ve en la carta),
  aprobar solo la foto, editar el texto, descartar, fallo, accesibilidad (axe) y 390 px.
