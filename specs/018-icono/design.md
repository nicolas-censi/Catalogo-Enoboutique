# 018 – Diseño técnico

## Archivos (convenciones de Next.js App Router)
- `app/favicon.ico`: se reemplaza (hoy es el de Next.js) por uno con 16, 32 y 48 px.
- `app/icon.png` (512 px) y `app/apple-icon.png` (180 px): Next.js agrega solo las
  etiquetas `<link rel="icon">` y `<link rel="apple-touch-icon">`.
- Se generan con `npm run icono` (`scripts/icono.mjs`, sharp) a partir del isotipo
  `assets/marca/isotipo.png` (PNG transparente, 1200 px): recortado a su dibujo y
  centrado en un cuadrado. Pestaña e `icon.png`: fondo transparente. `apple-icon.png`:
  sobre crema (#F6F2E9) con margen del 10 % (iOS rellena la transparencia de negro).
  Los archivos generados quedan en el repositorio.

## Riesgos
- El isotipo es un dibujo de líneas finas: a 16 px se ve como un círculo dorado (se
  reconoce por la forma y el color, no por el detalle).
- Los navegadores guardan el ícono mucho tiempo: después de publicar puede tardar en
  cambiar (se ve al abrir en una ventana privada o borrando el historial del sitio).

## Tests
- Unit: los archivos existen, son cuadrados, del tamaño esperado, y `favicon.ico` no es
  el de Next.js (cambió su contenido) e incluye 16, 32 y 48 px.
- E2E: el `<head>` de la carta tiene `icon` y `apple-touch-icon`, y responden 200.
