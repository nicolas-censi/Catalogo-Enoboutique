# Carta virtual – Lehonor Enoboutique

Carta digital pública (se abre escaneando un QR en el local) y panel de administración
para el personal. La visión del producto está en [`specs/000-vision.md`](specs/000-vision.md)
y las reglas de trabajo en [`CLAUDE.md`](CLAUDE.md).

**Stack:** Next.js 16 (App Router) · TypeScript estricto · Tailwind 4 · Supabase
(Postgres, Auth, Storage) · Vitest · Playwright · Vercel.

## Requisitos

- **Node 22** (está fijado en `.nvmrc`; con nvm: `nvm use`) y npm.
- Una cuenta de **Supabase** con un proyecto **de desarrollo** (por ejemplo,
  `enoboutique-dev`). Los tests escriben y borran datos ahí: no usar el proyecto de
  producción.

No hace falta Docker: el desarrollo y los tests usan el proyecto de Supabase en la nube.

## Puesta en marcha

1. **Instalar dependencias**

   ```bash
   npm install
   ```

2. **Variables de entorno.** Copiá `.env.example` como `.env.local` y completalo. El
   archivo explica de dónde sale cada dato en el panel de Supabase. `.env.local` nunca
   se sube al repositorio.

3. **Crear las tablas** en el proyecto de desarrollo. Hay dos formas equivalentes:

   ```bash
   # Con la CLI de Supabase (necesita conexión directa a Postgres)
   npx supabase link --project-ref "$SUPABASE_PROJECT_REF"
   npx supabase db push

   # Por la API de Supabase (HTTPS; sirve también detrás de un proxy)
   npm run db:migrar
   ```

4. **Cargar los datos de ejemplo** (artículos reales del export de Tango). Se puede
   repetir sin duplicar nada:

   ```bash
   npm run db:seed
   ```

5. **Levantar la app** en http://localhost:3000:

   ```bash
   npm run dev
   ```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta la app en modo desarrollo. |
| `npm run test` | Tests unitarios y de base de datos (Vitest). |
| `npm run test:e2e` | Tests de punta a punta en un navegador con pantalla de celular (Playwright). |
| `npm run test:e2e:produccion` | Tests que necesitan la app armada como en producción (ej.: caché de 1 minuto de la carta). Tardan un par de minutos. |
| `npm run lint` | Revisa el código con ESLint. |
| `npm run typecheck` | Verifica los tipos de TypeScript. |
| `npm run db:migrar` | Aplica las migraciones pendientes de `supabase/migrations/`. |
| `npm run db:seed` | Carga `supabase/seed.sql` (datos de ejemplo). |
| `npm run db:tipos` | Regenera `lib/tipos-db.ts` desde la base. Correrlo después de cada migración. |
| `npm run db:encargado -- <usuario>` | Crea un encargado con ese usuario (pide la contraseña). Para el primer encargado de un proyecto nuevo. |
| `npm run db:usuarios` | Muestra cómo pasar las cuentas del personal que entraban con email a usuario; con `-- --aplicar`, lo hace. |

### Tests

- Los tests de base de datos (`tests/db/`) corren contra el proyecto de desarrollo.
  Cada ejecución usa un prefijo único (`test-…`) y borra al final lo que creó, incluidos
  los usuarios de prueba.
- Playwright usa su propio Chromium. Si no se puede descargar (por ejemplo, en un
  entorno sin acceso), instalalo con `npx playwright install chromium` o indicá uno ya
  instalado con la variable `PLAYWRIGHT_CHROMIUM_EXECUTABLE`.
- **Entornos con proxy** (como el entorno en la nube de Claude Code): Node no usa el
  proxy por defecto. Definí `NODE_USE_ENV_PROXY=1` en el entorno antes de correr los
  tests o los scripts `db:*`.
  Además, `IMAGENES_SIN_OPTIMIZAR=1` hace que las fotos se sirvan sin pasar por el
  optimizador de Next.js, que no puede salir por ese proxy (en Vercel no hace falta).

## Base de datos

El esquema está en `supabase/migrations/` y el diseño en
[`specs/001-modelo-datos/design.md`](specs/001-modelo-datos/design.md). En resumen:

- **`productos`**: vinos, destilados, aceites y almacén, con sección, bodega y orden.
- **`anadas`**: cada fila es un artículo de Tango (`codigo_tango` único), con precio y
  disponibilidad. Los productos que no son vino tienen una sola, sin año.
- **`codigos_barras`**: asociados al producto, nunca a una añada.
- **`carta_publica`** (vista) y **`buscar_por_codigo_barras()`** (función): lo único que
  puede leer el público. Muestran solo lo visible y disponible, sin datos internos.
- **`personal`**: usuarios del panel. Encargado y vendedor pueden lo mismo, salvo
  gestionar el personal, que es solo del encargado.
- **Bucket `fotos`** (Storage): fotos de los productos; lectura pública, escritura solo
  del personal.

## Panel de administración

El panel está en **`/admin`** y se usa principalmente desde la computadora (también
funciona en el celular). Ahí el personal:

- busca y filtra productos (también ocultos, sin stock, sin foto o "a revisar");
- marca cada añada **Disponible / Sin stock** con un toque;
- da de alta y edita productos, añadas, códigos de barras y la foto (opcional);
- oculta, muestra o borra productos, y administra las secciones.

Los cambios hechos desde el panel se ven en la carta al instante.

### Personal

- Se entra al panel con **usuario y contraseña**, sin emails (spec 012).
- **El encargado** da de alta a cada persona desde **Personal** con un usuario (por
  ejemplo, `ncensi`), una contraseña (al menos 4 caracteres) y un rol, y se los pasa.
  Desde ahí también cambia contraseñas (si alguien se la olvida), roles y da de baja.
- **El primer encargado** de un proyecto nuevo se crea con
  `npm run db:encargado -- <usuario>`; después ya se da de alta gente desde el panel.
- Por dentro, Supabase guarda cada usuario como un email interno que no existe
  (`<usuario>@usuarios.enoboutique.invalid`) y la contraseña con un agregado fijo, porque
  exige al menos 6 caracteres. Por eso las cuentas no se crean a mano en Supabase.

### Variables en Vercel

En el proyecto de Vercel (Settings → Environment Variables), marcadas para
**Production y Preview**:

- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (carta y panel).
- `SUPABASE_SERVICE_ROLE_KEY`: solo para dar de alta, cambiar contraseñas y dar de baja
  personal. La usa únicamente `lib/admin/personal-servidor.ts`, en el servidor.

## Cómo trabajamos

El proyecto avanza por specs (`specs/NNN-nombre/`), con comandos propios de Claude Code:

- `/spec <funcionalidad>`: redacta una spec nueva, sin código.
- `/implement <carpeta-spec>`: implementa la siguiente tarea pendiente, con el test
  primero.
- `/review <carpeta-spec>`: verifica lo hecho contra los criterios de aceptación.

Los pasos de arranque están en [`EMPEZAR-AQUI.md`](EMPEZAR-AQUI.md).
