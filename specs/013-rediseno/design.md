# 013 – Diseño técnico

## Estilo
- Solo los tokens de marca de `app/globals.css` (colores y tipografías no cambian). Se
  agregan tokens de **movimiento** (`--ease-salida`, duraciones) y de radio.
- Inicio, encabezado de sección y listado: según el canvas "Enoboutique — propuestas de
  rediseño" (C, C y A). Componentes: `Encabezado` (logo grande en el inicio, chico en el
  resto), `Buscador` (línea dorada), `ListaSecciones` (centrada), `EncabezadoSeccion`,
  `TarjetaProducto` (estilo editorial con puntos guía).

## Movimiento
- Transiciones entre páginas con la API de **View Transitions** (`<ViewTransition>` de
  React, en `TransicionCarta`): fundido + desplazamiento de 8 px, 150–250 ms. Solo en las
  páginas de la carta: en el panel animaría cada actualización y trabaría el arrastre.
  Sin soporte del navegador, el cambio es inmediato.
- Páginas interiores: logo chico arriba y "‹ La carta" (o la sección) para volver.
- Aparición escalonada de los vinos con CSS (`@starting-style` / animación con
  `animation-delay` por posición, como máximo los primeros 8).
- Respuesta al toque: `:active` con escala 0,98 y cambio de opacidad.
- `@media (prefers-reduced-motion: reduce)`: sin animaciones ni transiciones.
- Sin JavaScript: todo se ve igual, sin movimiento.

## Promociones
- Tabla `promociones` (`id`, `imagen_path`, `orden`, `visible`, `creado_en`). Lectura pública de las visibles; escritura solo del encargado.
  `ordenar_promociones(ids)` como `ordenar_secciones`.
- Bucket público `promociones` (JPG, PNG, WebP, hasta 5 MB); en el navegador se
  achican a 1600 px de lado mayor (como las fotos de productos).
- Carrusel (Client Component, cargado con `next/dynamic` para no pesar en la carta):
  `scroll-snap` nativo (deslizar funciona sin JavaScript), pase automático cada 5 s con
  botón Pausar, indicador de posición. Pantalla completa con `<dialog>` (Cerrar, Escape,
  y el botón Atrás del celular vía `history`).
- Panel `/admin/promociones` (encargado): subir varias, lista arrastrable (`Ordenable`),
  ocultar/mostrar, borrar con confirmación. Texto alternativo: "Promoción N de M".

## Tests
- E2E: inicio y sección con el diseño nuevo (estructura y accesibilidad); carrusel
  (pasa solo, pausa, deslizar, pantalla completa, cerrar con botón y Escape);
  reducir movimiento sin animaciones; panel de promociones (subir, ordenar, ocultar,
  borrar, solo encargado); sin JavaScript.
- Producción: la carta sigue cargando en menos de 5 s con 3G.
- DB: permisos de `promociones` y del bucket.
