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
| `npm run lint` | Revisa el código con ESLint. |
| `npm run typecheck` | Verifica los tipos de TypeScript. |
| `npm run db:migrar` | Aplica las migraciones pendientes de `supabase/migrations/`. |
| `npm run db:seed` | Carga `supabase/seed.sql` (datos de ejemplo). |
| `npm run db:tipos` | Regenera `lib/tipos-db.ts` desde la base. Correrlo después de cada migración. |

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

## Base de datos

El esquema está en `supabase/migrations/` y el diseño en
[`specs/001-modelo-datos/design.md`](specs/001-modelo-datos/design.md). En resumen:

- **`productos`**: vinos, destilados, aceites y almacén, con sección, bodega y orden.
- **`anadas`**: cada fila es un artículo de Tango (`codigo_tango` único), con precio y
  disponibilidad. Los productos que no son vino tienen una sola, sin año.
- **`codigos_barras`**: asociados al producto, nunca a una añada.
- **`carta_publica`** (vista) y **`buscar_por_codigo_barras()`** (función): lo único que
  puede leer el público. Muestran solo lo visible y disponible, sin datos internos.
- **`personal`**: usuarios del panel (encargado o vendedor, con los mismos permisos).

### Dar de alta a alguien del personal

Hasta que exista el panel (spec 4), las altas se hacen a mano en Supabase:

1. **Authentication → Users → Add user → Create new user**: email y contraseña, con
   "Auto Confirm User" marcado.
2. **SQL Editor**, reemplazando el email y el rol (`encargado` o `vendedor`):

   ```sql
   insert into public.personal (user_id, rol)
   select id, 'encargado' from auth.users where email = 'persona@lehonor.com';
   ```

Para darla de baja alcanza con borrar el usuario en Authentication.

## Cómo trabajamos

El proyecto avanza por specs (`specs/NNN-nombre/`), con comandos propios de Claude Code:

- `/spec <funcionalidad>`: redacta una spec nueva, sin código.
- `/implement <carpeta-spec>`: implementa la siguiente tarea pendiente, con el test
  primero.
- `/review <carpeta-spec>`: verifica lo hecho contra los criterios de aceptación.

Los pasos de arranque están en [`EMPEZAR-AQUI.md`](EMPEZAR-AQUI.md).
