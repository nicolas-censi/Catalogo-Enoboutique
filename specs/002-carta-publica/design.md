# 002 – Diseño técnico

## Datos

### Búsqueda en Postgres
Migración nueva con las extensiones `pg_trgm` (similitud por trigramas, tolera errores
de tipeo) y `unaccent` (ignora tildes), en el esquema `extensions`.

Función pública `buscar_carta(texto text, limite int default 30)`:
- `security definer`, `stable`, `search_path = ''`, ejecutable por `anon` y
  `authenticated`.
- Si `texto` (sin espacios) son solo dígitos y tiene entre 8 y 14 caracteres, primero
  busca por código de barras exacto (reutiliza la lógica de
  `buscar_por_codigo_barras`).
- Si no, compara `texto` normalizado (minúsculas, sin tildes) contra un campo de
  búsqueda por producto: `nombre`, `bodega` y `varietal` normalizados. Usa
  `word_similarity` de `pg_trgm` para tolerar errores y partes de palabras.
- Devuelve filas de `carta_publica` de los productos encontrados (todas sus añadas
  disponibles), con una columna `relevancia`, ordenadas por relevancia, producto y
  año descendente. Máximo `limite` productos.
- Textos de menos de 2 caracteres devuelven vacío.

Función inmutable `normalizar_busqueda(texto)` (minúsculas, sin tildes, espacios
simples) e índices GIN de trigramas sobre `productos` (nombre + varietal) y `bodegas`
(nombre). Son dos índices porque un índice no puede combinar columnas de dos tablas.
`authenticated` puede ejecutar `normalizar_busqueda`, porque los índices la evalúan
al guardar con el usuario del personal; `anon` no.

### Lectura de la carta
- Inicio: secciones visibles con al menos un producto disponible, desde
  `carta_publica` (`select distinct seccion_id, seccion_nombre, seccion_orden`).
- Sección: filas de `carta_publica` filtradas por `seccion_id`, ordenadas por
  `producto_orden` y `anio` desc.
- Detalle: filas de `carta_publica` filtradas por `producto_id`.

No hacen falta tablas nuevas.

## Rutas y pantallas
| Ruta | Quién la usa | Qué muestra |
|------|--------------|-------------|
| `/` | cliente | logo, buscador y secciones (CA-1) |
| `/seccion/[id]` | cliente | productos de la sección con sus añadas (CA-2) |
| `/producto/[id]` | cliente | detalle del producto (CA-3); destino del escaneo (spec 3) |
| `/buscar?q=...` | cliente | resultados de búsqueda; también funciona sin JavaScript (CA-5, CA-6, CA-7) |

Las páginas son Server Components y se regeneran como máximo cada 60 segundos
(`revalidate = 60`) (CA-10). Se revisa en la documentación de Next.js 16 incluida en
`node_modules/next/dist/docs/` cómo se combina con `cacheComponents: true` antes de
implementar.

## Componentes
- `Encabezado`: logo (`marca/logo-enoboutique.png` servido optimizado con
  `next/image`) y nombre; vuelve al inicio.
- `Buscador` (Client Component): campo de texto con debounce de 250 ms que consulta
  `buscar_carta` por la API de Supabase con el cliente del navegador y muestra los
  resultados debajo. Es un `<form>` que hace GET a `/buscar`, así funciona sin JS.
- `ListaSecciones`, `TarjetaProducto` (nombre, bodega, varietal y lista de añadas),
  `ListaAnadas` (año o etiqueta, precio con `formatearPrecio`), `DetalleProducto`.
- `lib/carta.ts`: funciones de lectura (`leerSecciones`, `leerSeccion`, `leerProducto`)
  que agrupan las filas de `carta_publica` por producto. Se testean con Vitest.
- Textos nuevos en `lib/textos.ts` (sin resultados, placeholder del buscador, etc.).

## Tests
- **Base de datos (Vitest):** `buscar_carta` con los casos de CA-5, CA-6 y CA-8 sobre
  datos propios con prefijo (no depende del seed).
- **Unit (Vitest):** agrupación de filas por producto y etiquetas de añadas (CA-4).
- **E2E (Playwright, viewport 390×844):** inicio, sección, detalle, búsqueda con y sin
  JS, sin resultados, producto no disponible (CA-1 a CA-8), red lenta (CA-9),
  tamaño de elementos tocables y `@axe-core/playwright` (CA-11). Los e2e usan el seed
  del proyecto de desarrollo.

## Decisiones y alternativas descartadas
- **Búsqueda en el servidor (pg_trgm) en vez de en el celular (ej.: Fuse.js):** con
  ~2.400 productos, mandar la carta entera al celular para buscar ahí es lento con la
  señal del local (CA-9). Postgres ya tiene búsqueda difusa.
- **Secciones como entrada (propuesta):** una lista única de ~2.400 productos sería
  pesada; las secciones dividen la carta y el buscador cubre el resto.
- **`@axe-core/playwright`:** dependencia de desarrollo nueva, solo para tests de
  accesibilidad. No cambia el stack.

## Riesgos
- **Calidad de la búsqueda:** umbral de `word_similarity` en **0,5**, calibrado con los
  ~3.200 nombres reales del export de Tango. Con 0,4 aparecen falsos positivos
  (`cabernet` → Fernet Branca, `primus` → J. Rubio Privado); 0,45 da lo mismo que 0,5.
  `rutni` → Rutini queda justo en 0,5. Revisar con los nombres ya expandidos de la
  importación (spec 8).
- **Caché:** con `cacheComponents` de Next.js 16 hay que confirmar que `revalidate`
  funcione como se espera; si no, se usa la API de caché que indique la documentación.
