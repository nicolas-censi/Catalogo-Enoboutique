# 011 – Diseño técnico

## Datos
Una subsección es una **sección con sección padre**. Así reusa todo lo de las specs
004 y 005: nombre, visible, orden, destacados (`productos.orden`) y sus funciones.

- `secciones.seccion_padre_id uuid null references secciones(id) on delete restrict`.
- Índice `(seccion_padre_id, orden)`.
- Trigger en `secciones` (CA-1): el padre no puede tener padre (un solo nivel), una
  sección con subsecciones no puede pasar a ser subsección y una sección con productos
  no puede recibir subsecciones directamente (solo con `crear_subseccion`, que primero
  los mueve).
- Trigger en `productos` (CA-2): `seccion_id` no puede ser una sección que tiene
  subsecciones ("Elegí una subsección de Cava.").
- Función `crear_subseccion(padre uuid, nombre text) returns table (id, movidos)`
  (personal): crea la subsección al final de sus hermanas; si es la primera y el padre
  tiene productos, los pasa todos a la nueva, conservando sus destacados (en la misma
  transacción), y devuelve cuántos movió.
- `ordenar_secciones(ids)` pasa a ordenar **entre hermanas**: todas las de `ids` tienen
  que tener el mismo padre (o ninguno); las demás hermanas quedan al final. Las de otro
  nivel no se tocan.
- `carta_publica`: `seccion_*` sigue siendo la sección de primer nivel (la del padre,
  si hay) y se suman `subseccion_id`, `subseccion_nombre` y `subseccion_orden` (null si
  el producto está en una sección sin subsecciones). Un producto se ve solo si su
  sección y su padre están visibles (CA-5).
- `carta_secciones` sigue listando solo secciones de primer nivel (CA-3).
- `productos_admin`: suma `seccion_padre_nombre` para mostrar "Cava › Joyitas".

## Orden en la carta
`leerSeccion` ordena por `subseccion_orden` (nulls first) y después como en la spec
005 (`producto_orden`, `bodega_orden`, `producto_precio_min` desc, `producto_nombre`).
Agrupa los productos por subsección.

## Rutas y pantallas
| Ruta | Quién la usa | Qué muestra |
|------|--------------|-------------|
| `/seccion/[id]` | cliente | sin subsecciones, igual que hoy; con subsecciones, accesos `#subseccion-<id>` y un título (`h2`) por subsección con sus productos (CA-3) |
| `/admin/secciones` | personal | solo secciones de primer nivel, con la cantidad de subsecciones |
| `/admin/secciones/[id]` | personal | de una sección: sus subsecciones (crear, renombrar, ordenar, ocultar, borrar) y, si no tiene subsecciones, sus destacados; de una subsección: sus destacados (CA-4, CA-5) |
| `/admin` y fichas de producto | personal | filtro y selector con subsecciones ("Cava › Joyitas") (CA-2, CA-6) |

## Componentes
- `EditorSecciones` (existente): se reusa para las subsecciones de una sección (misma
  tabla arrastrable, con enlace a sus destacados).
- `TarjetaProducto` sin cambios. La página de sección agrupa por subsección.
- `FormularioProducto` y `FiltrosProductos`: selector con `<optgroup>` por sección.
  Una sección con subsecciones no se puede elegir para un producto.

## Tests
- **DB:** un solo nivel; sección con subsecciones no acepta productos; primera
  subsección mueve los productos; `ordenar_secciones` entre hermanas; `carta_publica`
  con subsección y visibilidad del padre; `carta_secciones` sin subsecciones.
- **E2E:** crear subsecciones (con el aviso de productos movidos), ordenarlas,
  ocultarlas, borrar; la carta con títulos y accesos (también sin JS); destacados de
  una subsección; selector y filtro del panel; accesibilidad y celular.

## Decisiones y alternativas descartadas
- **Sección con padre** en vez de una tabla `subsecciones` aparte: reusa orden,
  visibilidad, destacados y pantallas; la carta y el panel ya saben manejar secciones.
- **Mover los productos a la primera subsección** en vez de bloquear: nunca queda un
  producto suelto ni oculto sin querer.

## Riesgos
- Cambiar `carta_publica` otra vez: `buscar_carta` y `buscar_por_codigo_barras` ya
  eligen columnas por nombre (spec 005); se revisan con los tests de búsqueda.
- La importación de Tango (spec 8) tendrá que elegir subsección cuando la sección las
  tenga.
