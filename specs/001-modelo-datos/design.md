# 001 – Diseño técnico

## Datos

Esquema en Postgres (Supabase), con migraciones versionadas en `supabase/migrations/`.
Se aplican sobre un **proyecto de Supabase de desarrollo en la nube**, de dos formas
equivalentes:
- con la Supabase CLI (`supabase link` + `supabase db push`), si hay conexión directa
  a Postgres;
- con `npm run db:migrar` (`scripts/migrar.mjs`), que ejecuta las migraciones por la API
  de administración de Supabase (HTTPS). Sirve en entornos donde el puerto de Postgres
  está bloqueado, como el entorno en la nube de Claude Code. Registra cada migración en
  `supabase_migrations.schema_migrations`, igual que la CLI.
 El proyecto de producción es otro
y se crea en la spec 9.
Nombres de tablas y columnas en español, sin tildes y en snake_case.

### Enums
- `tipo_producto`: `vino`, `destilado`, `aceite`, `almacen`.
- `tipo_anada`: `con_anio`, `sin_especificar`, `sin_anada`.

### `secciones`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `nombre` | text not null | |
| `orden` | integer not null | posición en la carta |
| `visible` | boolean not null default true | |
| `creado_en`, `actualizado_en` | timestamptz | |

### `bodegas`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `nombre` | text not null unique | ej.: "Salentein" |

Tabla aparte (y no un texto en el producto) para que el nombre se corrija una sola vez
y el buscador de la spec 2 pueda buscar por bodega. Es opcional para los productos que
no son vino.

### `productos`
Es el "Vino" de la regla de dominio, generalizado para incluir destilados, aceites y
almacén.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `tipo` | `tipo_producto` not null | |
| `nombre` | text not null | nombre legible de la carta ("Rutini Malbec") |
| `bodega_id` | uuid FK → `bodegas` null | |
| `varietal` | text null | |
| `descripcion` | text null | solo texto aprobado (la IA llega en la spec 7) |
| `foto_path` | text null | ruta en Supabase Storage (se sube en la spec 4) |
| `seccion_id` | uuid FK → `secciones` null | sin sección = no aparece en la carta |
| `orden` | integer not null default 0 | posición dentro de la sección |
| `visible` | boolean not null default true | ocultar/mostrar |
| `creado_en`, `actualizado_en` | timestamptz | |

### `anadas`
Cada fila es **un artículo de Tango**. Para los productos que no son vino es la única
"presentación" del producto.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `producto_id` | uuid FK → `productos` not null, on delete cascade | |
| `codigo_tango` | text not null **unique** | `Cód. artículo` (CA-4) |
| `descripcion_tango` | text not null | texto original de Tango, referencia interna |
| `tipo` | `tipo_anada` not null | |
| `anio` | smallint null | obligatorio si y solo si `tipo = con_anio` (check) |
| `precio` | numeric(12,2) null | ARS; null = sin precio |
| `en_stock` | boolean not null default false | la carta nunca muestra cantidades |
| `creado_en`, `actualizado_en` | timestamptz | |

Restricciones:
- `unique (producto_id, anio)`: no se repite el año en un mismo vino (CA-7).
- Check: `anio between 1900 and 2100`.
- Trigger `anadas_validar_tipo_producto`: si el producto no es `vino`, la añada tiene
  que ser `sin_anada` y no puede existir otra añada para ese producto (CA-6).

### `codigos_barras`
| Columna | Tipo | Notas |
|---|---|---|
| `codigo` | text PK | un código pertenece a un solo producto (CA-5) |
| `producto_id` | uuid FK → `productos` not null, on delete cascade | |

Tabla aparte porque un vino puede tener varios códigos (de distintas añadas en Tango),
y cada código apunta siempre al producto, nunca a una añada.

### `personal`
| Columna | Tipo | Notas |
|---|---|---|
| `user_id` | uuid PK FK → `auth.users` | |
| `rol` | text not null check in (`encargado`, `vendedor`) | hoy los dos tienen los mismos permisos |

Función `es_personal()` (security definer): devuelve true si `auth.uid()` está en
`personal`.

### Vista pública `carta_publica`
Vista que lee el cliente (con `security_invoker = false`, dueña `postgres`, y solo
`select` para `anon`). Devuelve una fila por añada visible, con los datos del producto,
la sección y la bodega. Condiciones (CA-8):
- `productos.visible` y `secciones.visible`, y producto con sección asignada;
- `anadas.en_stock`.

Las añadas sin precio sí se incluyen, con `precio` en null; la pantalla muestra
"Consultar precio".

Columnas: `seccion_id`, `seccion_nombre`, `seccion_orden`, `producto_id`, `producto_tipo`,
`producto_nombre`, `bodega_nombre`, `varietal`, `descripcion`, `foto_path`,
`producto_orden`, `anada_id`, `anada_tipo`, `anio` y `precio`. Una vista no garantiza
orden: quien la lee ordena por `seccion_orden`, `producto_orden` y `anio` descendente
(sin año al final).

Como la vista solo incluye añadas visibles, un producto sin añadas visibles
directamente no aparece. **No expone** `codigo_tango`, `descripcion_tango` ni datos
internos.

Función pública `buscar_por_codigo_barras(codigo text)`: devuelve las filas de
`carta_publica` del producto asociado a ese código (CA-5).

### Seguridad (RLS)
- RLS activado en todas las tablas.
- `anon`: sin acceso directo a las tablas; solo a `carta_publica` y a
  `buscar_por_codigo_barras`.
- `authenticated` con `es_personal()`: `select`, `insert`, `update` y `delete` en todas
  las tablas, salvo `personal` (solo lectura; el alta se hace desde Supabase).
- `authenticated` sin `es_personal()`: igual que `anon`.

### `actualizado_en`
Trigger genérico `set_actualizado_en()` en todas las tablas que tienen la columna.

## Rutas y pantallas
| Ruta | Quién la usa | Qué muestra |
|------|--------------|-------------|
| `/` | cliente | página provisoria con el nombre "Lehonor Enoboutique" usando los tokens de marca. La reemplaza la carta en la spec 2. |

El nombre de la página provisoria es un placeholder técnico: los textos editables
llegan con la spec 6.

## Estructura del proyecto
```
app/                    # Next.js App Router
  layout.tsx            # tipografías con next/font/google, idioma es-AR
  page.tsx              # página provisoria
lib/
  supabase/server.ts    # cliente para Server Components (@supabase/ssr)
  supabase/client.ts    # cliente para el navegador
  formato.ts            # formatearPrecio() (CA-11)
  tipos-db.ts           # tipos generados con `supabase gen types`
supabase/
  config.toml
  migrations/           # una migración por tarea de datos
  seed.sql              # datos de ejemplo para desarrollo
tests/
  unit/                 # Vitest
  db/                   # Vitest contra el Supabase local (RLS, vista, restricciones)
  e2e/                  # Playwright
marca/                  # logo (ya existe)
.env.example
```

## Componentes
- `formatearPrecio(valor: number | null): string` en `lib/formato.ts`, con
  `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })`.
  Con `null` devuelve "Consultar precio". Ese texto vive en un único módulo,
  `lib/textos.ts`, hasta que la spec 6 lo haga editable desde el panel.
  Si en el futuro hay centavos, se revisa en la spec que lo necesite.
- Clientes de Supabase en `lib/supabase/`. Las claves salen de `.env.local`
  (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
  `SUPABASE_SERVICE_ROLE_KEY` se usa solo en los tests.

## Tests
- **Unit (Vitest):** `formatearPrecio` y configuración de tokens.
- **Base de datos (Vitest + proyecto de Supabase de desarrollo):** cada test crea sus
  propios datos con la clave `service_role` y los borra al terminar. Para no chocar
  con otros datos, los nombres y códigos de prueba llevan un prefijo único por
  ejecución (ej.: `test-<id>-`). Se prueba como `anon`, como usuario del personal y
  como usuario autenticado que no es personal. Los usuarios de prueba se crean y se
  borran con la API de administración de Auth.
- **E2E (Playwright):** la página de inicio carga en un viewport de celular, sin
  errores en la consola y con las tipografías y colores de marca.
- `npm run test` corre unit + base de datos; `npm run test:e2e` corre Playwright.

## Decisiones y alternativas descartadas
- **"Producto" en vez de "Vino" en el esquema:** la carta también incluye destilados,
  aceites y almacén. Un solo modelo con `tipo` evita duplicar tablas, pantallas y
  buscador. En la interfaz se sigue diciendo "vino" cuando corresponde.
- **Añada = artículo de Tango:** así lo exporta Tango, y permite actualizar precios y
  stock cruzando por `codigo_tango` sin ambigüedad.
- **Códigos de barras en tabla aparte:** un vino puede tener varios. Ponerlos en la
  añada contradiría la regla de dominio, y una sola columna en el producto perdería
  datos.
- **Stock como booleano `en_stock`:** la carta solo muestra Disponible / Sin stock. La
  cantidad de Tango se puede convertir en booleano al importar (spec 8). Si más adelante
  hace falta la cantidad, se agrega una columna.
- **Vista pública en lugar de abrir las tablas a `anon`:** garantiza por diseño que el
  cliente nunca vea datos internos ni productos ocultos.
- **Proyecto de Supabase de desarrollo en la nube para desarrollo y tests:** es el
  mismo Postgres, RLS y Auth que en producción, y no depende de Docker. Se descartaron
  Supabase local (necesita Docker, que no está disponible en todos los entornos) y
  simular la base en memoria (no prueba RLS).

## Riesgos
- **Tests sobre una base compartida:** si dos personas corren los tests a la vez sobre
  el mismo proyecto de desarrollo, los prefijos únicos evitan choques. El proyecto de
  desarrollo no debe tener datos reales que importen.
- **Claves:** `SUPABASE_SERVICE_ROLE_KEY` saltea RLS. Vive solo en `.env.local` y en
  los secretos del entorno, nunca en el código, y no se usa en el código de la app.
- **Agrupación incorrecta:** si en la importación (spec 8) dos vinos distintos quedan
  en un mismo producto, el `unique (producto_id, anio)` puede chocar. Es deseable,
  porque fuerza la revisión humana.
- **Versiones:** fijar las versiones de Next.js, Supabase CLI y Node en el proyecto
  (`engines` y `.nvmrc`) para que el entorno sea reproducible.
