# 006 – Diseño técnico

## Datos
- Tabla `marca` de una sola fila (`id = 1`): `bienvenida text` (≤ 200, null = sin
  bienvenida), `logo_path text` (null = logo original), `actualizado_en`.
- RLS: lectura pública (la carta la necesita); modificar solo el encargado.
- Storage: bucket público `marca` (lectura pública, escritura del encargado), para el
  logo. Cada logo nuevo con nombre nuevo (sin problemas de caché del navegador); el
  anterior se borra al reemplazarlo o al volver al original.

## Rutas y pantallas
| Ruta | Quién | Qué |
|---|---|---|
| `/admin/marca` | encargado | bienvenida y logo (subir, vista previa sobre el fondo, volver al original) |
| `/` | cliente | bienvenida debajo del logo |
| todas las de la carta | cliente | el logo guardado en el encabezado |

## Componentes
- `Encabezado`: logo guardado (URL pública de Storage) o el original
  (`public/logo-enoboutique.png`); mismo alto y texto alternativo.
- `EditorMarca` (panel): formulario de bienvenida con contador de caracteres; subida
  de logo con vista previa local (antes de subir) y botón para volver al original.
- Validación de archivo: PNG o WebP, hasta 2 MB (`lib/admin/marca.ts`).

## Carga
El logo y la bienvenida se leen dentro de un `Suspense`: mientras tanto se ve el logo
original (mismo tamaño, no salta nada). Así el inicio se puede prearmar.

## Caché
`marcaCarta()` con `"use cache"` y la etiqueta `carta`, como el resto de la carta: al
guardar, `invalidarCarta()` (se ve al instante).

## Tests
- Unit: validación de bienvenida y del archivo del logo.
- DB: lectura pública, escritura solo del encargado (tabla y bucket).
- E2E: bienvenida en el inicio (y vacía no se muestra); logo nuevo en la carta y volver
  al original; vendedor sin acceso; accesibilidad y celular.
