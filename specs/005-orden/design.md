# 005 – Diseño técnico

## Datos
- `productos.orden` pasa a significar **posición entre los destacados de su sección**:
  `null` = no destacado. Migración: se le quita `not null` y el `default 0`, y se pone
  en `null` en todos los productos (hoy nadie lo usa a mano). `seed.sql` se ajusta.
- Trigger `productos_cambio_seccion`: si cambia `seccion_id`, pone `orden = null`
  (CA-3).
- Vista `carta_publica`: se agrega al final la columna `producto_precio_min`
  (`min(a.precio) over (partition by p.id)` entre las añadas visibles en la carta).
- Funciones (`security invoker`, sujetas a RLS, solo personal):
  - `ordenar_secciones(ids uuid[])`: las secciones de `ids` toman las posiciones 1..n;
    las que no vinieron (por ejemplo, una recién creada por otra persona mientras se
    ordenaba) quedan al final, en su orden anterior.
  - `ordenar_destacados(seccion uuid, ids uuid[])`: pone `orden = posición` a los
    productos de `ids` (todos de esa sección; si no, rechaza) y `null` al resto de la
    sección. En una sola transacción.
- `secciones.orden` no cambia.

## Orden en la carta
`leerSeccion` (`lib/carta.ts`) ordena por:
`producto_orden` (nulls last) → `normalizar(bodega_nombre)` (nulls last) →
`producto_precio_min` desc → `producto_nombre` → `anio` desc (nulls last).
Para ordenar la bodega sin tildes, `bodegas` suma la columna calculada `nombre_orden`
(`normalizar_busqueda(nombre)`, guardada al escribir: el público no puede llamar a esa
función) y la vista la expone como `bodega_orden`. `buscar_carta` pasa a elegir sus
columnas una por una, porque la vista sumó columnas. El orden se arma en la base, no en
JavaScript, así es el mismo en todas las consultas.

## Rutas y pantallas
| Ruta | Quién la usa | Qué muestra |
|------|--------------|-------------|
| `/admin/secciones` | personal | lista de secciones arrastrable (CA-1); cada una enlaza a su pantalla |
| `/admin/secciones/[id]` | personal | destacados de la sección arrastrables, con "Quitar"; buscador para agregar productos de la sección; texto que explica el orden automático (CA-3) |

## Componentes
- `Ordenable` (Client Component, dnd-kit: `@dnd-kit/core` + `@dnd-kit/sortable`):
  lista vertical genérica (filas de tabla o elementos de lista) con `ManijaOrdenable`, `PointerSensor` (con distancia mínima, para no
  trabar el scroll en el celular), `KeyboardSensor` y anuncios en español
  (`announcements` de dnd-kit con textos de `lib/textos.ts`). Al soltar llama a
  `onCambio(ids)`; si falla, vuelve al orden anterior y muestra el error.
- `EditorSecciones` (existente): usa `Ordenable`; se saca el texto
  "(próximamente)".
- `EditorDestacados`: `Ordenable` + botón "Quitar" + buscador (reusa
  `buscar_admin` filtrado por sección y sin los que ya son destacados). Los que no se
  ven en la carta (ocultos o sin stock) se marcan. El nombre de cada sección en
  `/admin/secciones` enlaza a su pantalla.
- Acciones de servidor `ordenarSecciones` y `guardarDestacados` (agregar, quitar y
  ordenar guardan la lista completa): llaman a las funciones
  y a `updateTag("carta")` (al instante, como el resto del panel).

## Tests
- **DB (Vitest):** las funciones ordenan, rechazan listas incompletas o productos de
  otra sección y el público no puede llamarlas; el trigger limpia el destacado al
  cambiar de sección; `carta_publica` trae `producto_precio_min` y `bodega_orden`.
- **Unit:** orden de una sección con destacados, bodegas con tildes, sin bodega, varias
  añadas y empates de precio.
- **E2E:** arrastrar con el mouse y con el teclado (secciones y destacados), error al
  guardar, la carta refleja el cambio, axe y celular.

## Decisiones y alternativas descartadas
- **Destacados + automático** en vez de ordenar a mano todo: una sección tiene hasta
  más de mil vinos y los nuevos (o importados de Tango) caen solos en su lugar.
- **Reusar `productos.orden`** en vez de una columna nueva: hoy no tiene otro uso y
  evita dos columnas que digan casi lo mismo.
- **Guardar al soltar** en vez de un botón "Guardar": menos pasos y no se pierde nada
  al salir de la pantalla.

## Riesgos
- Dos personas ordenando la misma lista a la vez: gana el último cambio. Es aceptable
  para un local; no se bloquea.
- Arrastrar en Playwright puede ser inestable: se prueba sobre todo con teclado y un
  test con el mouse en pasos.
