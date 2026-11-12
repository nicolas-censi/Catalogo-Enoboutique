# 018 – Diseño técnico

## Archivos (convenciones de Next.js App Router)
- `app/favicon.ico`: se reemplaza (hoy es el de Next.js) por uno con 16, 32 y 48 px.
- `app/icon.png` (512 px) y `app/apple-icon.png` (180 px): Next.js agrega solo las
  etiquetas `<link rel="icon">` y `<link rel="apple-touch-icon">`.
- Se generan con `npm run icono` (`scripts/icono.mjs`, sharp) a partir del isotipo
  `assets/marca/isotipo.png` (PNG transparente, 1200 px): recortado a su dibujo, al 80 %
  de un círculo casi negro (#1B1A17). Pestaña e `icon.png`: esquinas transparentes.
  `apple-icon.png`: el círculo sobre crema (#F6F2E9) con margen del 6 % (iOS rellena la
  transparencia de negro). PNG con paleta para que pesen poco.
  Los archivos generados quedan en el repositorio.

## Riesgos
- El isotipo es un dibujo de líneas finas: a 16–32 px se ve como un círculo dorado sobre
  negro (se reconoce por la forma y el color, no por el detalle). Sin el círculo, en las
  pestañas claras casi no se veía (opción descartada).
- Los navegadores guardan el ícono mucho tiempo: después de publicar puede tardar en
  cambiar (se ve al abrir en una ventana privada o borrando el historial del sitio).

## Tests
- Unit: los archivos existen, son cuadrados, del tamaño esperado, y `favicon.ico` no es
  el de Next.js (cambió su contenido) e incluye 16, 32 y 48 px.
- E2E: el `<head>` de la carta tiene `icon` y `apple-touch-icon`, y responden 200.
