# 016 – Diseño técnico

## Colores
- Los colores del panel (`.tema-panel`, spec 014) pasan a ser los de toda la app: se
  mueven a `@theme` en `app/globals.css` y `.tema-panel` queda sin colores propios (se
  borra el bloque de colores; el panel ya no necesita sobrescribir nada).
- `--color-carta-fondo` pasa a #F6F2E9 y `--color-carta-texto` a #1B1A17 (vista previa del
  logo y tarjeta QR).
- `--color-dorado` (#B19750) queda solo para adornos (`bg-dorado`, `border-dorado`).
  `--color-dorado-texto` (#7A6428, 5,1:1) para el poco texto dorado que quede, si hace
  falta.

## Pantallas y componentes que cambian
| Archivo | Cambio |
|---|---|
| `app/globals.css` | tokens claros en `@theme`; `.tema-panel` sin colores |
| `components/FormularioBusqueda.tsx` | ícono de buscar en `text-texto` (hoy dorado) |
| `components/CarruselPromociones.tsx` | flechas y botón de cerrar en `text-texto` |
| `components/BotonEscanear.tsx` | contorno de foco en `outline-texto` |
| `app/escanear`, `components/Escaner.tsx` | íconos y textos en tokens claros; el visor de la cámara sigue oscuro (es la imagen de la cámara) |
| `components/admin/EditorMarca.tsx`, `TarjetaQr.tsx` | ya usan `carta-fondo` / `carta-texto`: cambian solos |

Las líneas doradas (`bg-dorado`, `border-dorado/…`) no cambian.

## Decisiones y alternativas descartadas
- **Un solo tema** en vez de mantener dos (carta oscura y panel claro): menos código y
  la marca se ve igual en todos lados.
- **Dorado solo en adornos:** el dorado del logo sobre crema tiene 2,5:1, no alcanza ni
  para íconos (3:1).
- Descartado oscurecer el dorado para usarlo en textos: deja de ser el del logo.

## Riesgos
- Que el logo actual (dorado o crema) no se lea sobre crema hasta que se suba el nuevo →
  subirlo antes de publicar el cambio, o publicarlo junto.
- Fotos de productos o promociones con fondo blanco pueden "fundirse" con el crema → se
  revisa con las fotos reales; si hace falta, un borde fino.

## Tests
- Unit: contraste AA de todos los pares de colores de la carta (amplía
  `tests/unit/tema-panel.test.ts`); el dorado no se usa como color de texto en
  componentes de la carta.
- E2E: fondo y texto de la carta con los colores nuevos; axe (contraste) en inicio,
  sección, vino, búsqueda y escanear, a 390 px; vista previa del logo y tarjeta QR con
  fondo crema.
