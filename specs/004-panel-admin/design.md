# 004 – Diseño técnico

## Datos

### Storage: fotos
Migración que crea el bucket **público** `fotos` (lectura pública, como ya espera
`lib/fotos.ts`) con políticas en `storage.objects`:
- lectura: cualquiera (bucket público);
- subir, reemplazar y borrar: solo `public.es_personal()`.
- Límite de 10 MB y tipos `image/jpeg`, `image/png`, `image/webp`, `image/heic`
  configurados en el bucket.

Ruta del archivo: `productos/<producto_id>/<uuid>.<ext>`. Al reemplazar o quitar una
foto se borra el archivo anterior. `productos.foto_path` guarda la ruta.

### Sin tablas nuevas
El panel usa las tablas de la spec 001 con el usuario del personal: las políticas RLS
ya le permiten leer y modificar todo (CA-10 de la spec 001). No se usa la clave
secreta en la app.

## Rutas y pantallas
| Ruta | Quién la usa | Qué muestra |
|------|--------------|-------------|
| `/admin/ingresar` | personal | formulario de ingreso (CA-1) |
| `/admin` | personal | lista y búsqueda de productos con filtros e interruptor de stock (CA-2, CA-3) |
| `/admin/productos/nuevo` | personal | alta de producto (CA-4) |
| `/admin/productos/[id]` | personal | ficha: datos, añadas, códigos, foto, ocultar, borrar (CA-4 a CA-8) |
| `/admin/secciones` | personal | secciones: crear, renombrar, ocultar (CA-9) |

Todas las rutas `/admin/*` (salvo `ingresar`) verifican la sesión en el servidor y
que el usuario sea del personal; si no, redirigen a `/admin/ingresar` o muestran "No
tenés acceso al panel". Llevan `robots: noindex`.

### Sesión
- Login con email y contraseña de Supabase Auth (`signInWithPassword`) desde una
  Server Action.
- `proxy.ts` de Next.js 16 (antes "middleware") refresca la sesión de Supabase en las
  rutas `/admin/*`, según la guía de `@supabase/ssr`. Se revisa la documentación de
  Next.js 16 incluida (`01-getting-started/16-proxy.md`) antes de implementar.
- Las páginas del panel leen datos con el cliente de servidor con cookies
  (`lib/supabase/server.ts`): son dinámicas y no se cachean.

### Guardado
- Cambios con **Server Actions** en `app/admin/acciones/*.ts`. Cada acción:
  1. verifica que el usuario sea del personal;
  2. valida los datos (funciones puras en `lib/admin/validacion.ts`, testeadas);
  3. guarda con el cliente del usuario (RLS);
  4. traduce los errores de Postgres a mensajes claros (`lib/admin/errores.ts`:
     `23505` código de Tango o año repetido, `23514` reglas de presentación, etc.);
  5. invalida el caché de la carta (CA-11).
- El interruptor de stock usa `useOptimistic`: cambia al instante y vuelve atrás si
  falla el guardado.

### Caché de la carta (CA-11)
Las lecturas de `lib/carta-cache.ts` se etiquetan con `cacheTag('carta')`. Cada acción
del panel llama a `updateTag('carta')` (o la API equivalente que indique la
documentación de Next.js 16 incluida) para que la carta se regenere en el siguiente
pedido. El `cacheLife` de 1 minuto se mantiene para cambios hechos por fuera del panel.

## Componentes
- `FormularioIngreso`, `BotonSalir`.
- `ListaProductosAdmin` con `BuscadorAdmin` y `FiltrosAdmin` (los filtros van en la URL
  para poder compartir/volver).
- `InterruptorStock` (Client Component, optimista).
- `FormularioProducto` (alta y edición), `SelectorBodega` (elegir o crear).
- `EditorAnadas` (tabla editable en una columna en celular), `EditorCodigos`.
- `SubirFoto`: `<input type="file" accept="image/*" capture="environment">`; reduce la
  imagen en el navegador a 1600 px de lado mayor y la convierte a WebP antes de subirla
  (las fotos de celular pesan varios MB y la señal es mala).
- `ConfirmarBorrado` (diálogo accesible).
- Textos nuevos en `lib/textos.ts` (sección `admin`).

### Búsqueda en el panel
Función `buscar_admin(texto)` (`security invoker`, solo personal por RLS) que reutiliza
`normalizar_busqueda` y `word_similarity` sobre **todos** los productos (no solo los
visibles), y además busca coincidencia exacta por `codigo_tango` y código de barras.

## Tests
- **Unit (Vitest):** validaciones, traducción de errores, reducción de imagen (tamaño
  resultante).
- **Base de datos (Vitest):** políticas del bucket `fotos` (personal sube y borra;
  público lee; anónimo y no-personal no suben), `buscar_admin`.
- **E2E (Playwright):** con un usuario del personal creado en el test (ayudante de la
  spec 001) y datos con prefijo: ingreso y rechazo (CA-1), lista/filtros (CA-2),
  interruptor de stock y su efecto en la carta (CA-3, CA-11), alta/edición de producto
  y añadas con errores (CA-4, CA-5), códigos (CA-6), subir una foto de prueba y verla
  en el detalle de la carta (CA-7; cierra el pendiente del CA-3 de la spec 002),
  ocultar/borrar (CA-8), secciones (CA-9), axe y tamaños en las pantallas del panel
  (CA-10).
- **E2E en modo producción:** un cambio de precio desde el panel se ve en la carta sin
  esperar el minuto (CA-11).

## Decisiones y alternativas descartadas
- **Server Actions con el cliente del usuario (RLS) en vez de la clave secreta:** la
  seguridad queda en la base (ya probada en la spec 001) y no hay una clave que saltea
  RLS en el servidor de la app.
- **Panel dentro de la misma app (`/admin`)** en vez de una app aparte: comparte
  modelo, tipos y despliegue.
- **Reducir la foto en el navegador:** sube rápido con mala señal y ocupa menos en
  Storage. Se descartó subir el original y procesarlo en el servidor.
- **Stock con interruptor optimista:** es la tarea más frecuente; no debe requerir
  "Guardar".

## Riesgos
- **Sesión con caché de Next.js 16:** las páginas del panel no deben quedar cacheadas
  (usan cookies). Se verifica con un test que un usuario sin sesión nunca ve datos.
- **HEIC (iPhone):** si el navegador no puede decodificar HEIC para reducirla, se sube
  tal cual dentro del límite de 10 MB; se prueba en iPhone real antes de cerrar.
