# 018 – Diseño técnico

## Archivos (convenciones de Next.js App Router)
- `app/favicon.ico`: se reemplaza (hoy es el de Next.js) por uno con 16, 32 y 48 px.
- `app/icon.png` (512 px) y `app/apple-icon.png` (180 px): Next.js agrega solo las
  etiquetas `<link rel="icon">` y `<link rel="apple-touch-icon">`.
- Se generan con `scripts/icono.mjs` (sharp) a partir de la "L" del logo de la marca
  (`public/logo-enoboutique.png` no sirve: es dorado; se usa el logo negro), centrada al
  64 % del alto sobre crema. Los PNG quedan en el repositorio.

## Riesgos
- Los navegadores guardan el ícono mucho tiempo: después de publicar puede tardar en
  cambiar (se ve al abrir en una ventana privada o borrando el historial del sitio).

## Tests
- Unit: los archivos existen, son cuadrados, del tamaño esperado, y `favicon.ico` no es
  el de Next.js (cambió su contenido) e incluye 16, 32 y 48 px.
- E2E: el `<head>` de la carta tiene `icon` y `apple-touch-icon`, y responden 200.
