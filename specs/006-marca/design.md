# 006 – Diseño técnico

## Datos
- Tabla `marca` de una sola fila (`id = 1`): `bienvenida text` (≤ 200), `logo_path text`
  (null = logo original), `color_fondo`, `color_superficie`, `color_principal`,
  `color_texto` (`#RRGGBB`, null = el de la marca), `actualizado_en`.
- RLS: lectura pública (la carta la necesita); modificar solo el encargado.
- Storage: bucket público `marca` (lectura pública, escritura del encargado), para el
  logo. Cada logo nuevo con nombre nuevo (sin problemas de caché del navegador).

## Colores en tiempo de ejecución
Hoy los tokens están en `@theme inline` de `app/globals.css`: Tailwind copia los valores
dentro de cada clase al compilar, así que no se pueden cambiar sin volver a publicar.
Pasan a `@theme` (sin `inline`): las clases usan `var(--color-…)`, y el layout raíz
agrega `<style>:root{--color-fondo:…}</style>` con los colores guardados. Los tokens
por función se derivan de los cuatro colores:
| Guardado | Tokens |
|---|---|
| fondo | `--color-fondo`, `--color-boton-texto` |
| tarjetas | `--color-superficie` |
| principal | `--color-dorado`, `--color-destacado`, `--color-titulo`, `--color-boton` |
| texto | `--color-texto`, `--color-texto-suave` |
La regla de CLAUDE.md se mantiene: los colores siguen saliendo solo de los tokens.

## Contraste (CA-4)
`lib/marca/contraste.ts` (funciones puras, con tests): luminancia relativa y razón de
contraste WCAG 2.1; pares controlados: principal/fondo, principal/tarjetas,
texto/fondo, texto/tarjetas, fondo (texto de botón)/principal. Se valida en el
navegador (vista previa) y otra vez en el servidor antes de guardar.

## Rutas y pantallas
| Ruta | Quién | Qué |
|---|---|---|
| `/admin/marca` | encargado | bienvenida, logo (subir, vista previa, volver al original) y colores (selectores, vista previa, contraste, volver a los de la marca) |
| `/` | cliente | bienvenida debajo del logo |
| todas | todos | logo y colores guardados |

## Caché
`marcaCarta()` con `"use cache"` y la etiqueta `carta` (como el resto de la carta): al
guardar, `invalidarCarta()` (al instante).

## Tests
- Unit: contraste (casos conocidos: negro/blanco 21:1, dorado/negro 7,4:1), validación
  de colores y bienvenida.
- DB: lectura pública, escritura solo del encargado.
- E2E: bienvenida en el inicio; logo nuevo en la carta y volver al original; colores
  nuevos aplicados (color calculado del fondo), rechazo por contraste, volver a los de
  la marca; vendedor sin acceso; accesibilidad y celular.

## Riesgos
- Colores que no gustan: la vista previa y el botón de volver a la marca lo acotan.
