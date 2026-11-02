# 013 – Rediseño de la carta y promociones

**Estado:** Borrador

## Objetivo
Que la carta se vea y se sienta actual y cuidada (2026), a la altura de Enoboutique,
manteniendo la paleta, las tipografías y el logo de la marca, y sumar un espacio de
promociones con imágenes que el encargado sube desde el panel.

## Diseño elegido
De las propuestas (canvas "Enoboutique — propuestas de rediseño"):
- **Inicio:** propuesta C (lujo minimal): logo grande centrado, línea dorada fina,
  bienvenida (spec 006), buscador como una línea dorada con el botón de escanear, y las
  secciones centradas en la tipografía de títulos. Las promociones, abajo de todo.
- **Encabezado de sección:** propuesta C: "‹ La carta" arriba, nombre de la sección
  grande y centrado, línea dorada y las subsecciones como enlaces subrayados.
- **Listado de vinos:** propuesta A (editorial): nombre en la tipografía de títulos,
  bodega · varietal debajo y cada añada con puntos guía hasta el precio; líneas doradas
  finas entre vinos, sin cajas.

## Historias de usuario
- Como **cliente**, quiero una carta **linda, clara y fluida** en el celular.
- Como **cliente**, quiero ver las **promociones** del local y ampliarlas.
- Como **encargado**, quiero **subir, ordenar, ocultar y borrar** las imágenes de las
  promociones.

## Criterios de aceptación
### CA-1: Inicio
- **Dado** el cliente que abre la carta
- **Cuando** carga el inicio
- **Entonces** ve el diseño elegido: logo, línea dorada, bienvenida (si hay), buscador
  con escanear, secciones centradas y, abajo de todo, las promociones (si hay).

### CA-2: Sección
- **Dado** una sección
- **Cuando** el cliente la abre
- **Entonces** ve el encabezado elegido (con las subsecciones como enlaces, que llevan a
  cada subsección dentro de la página) y el listado de vinos estilo editorial.
- Y el detalle de un producto y los resultados de búsqueda usan el mismo estilo.

### CA-3: Movimiento
- **Dado** el cliente navegando la carta
- **Cuando** pasa de una página a otra
- **Entonces** el cambio es suave (la página nueva aparece con un fundido y un leve
  desplazamiento), los vinos aparecen escalonados al cargar y los botones y enlaces
  responden al toque.
- Y si el celular tiene activado **reducir movimiento**, no hay animaciones.
- Y nada de esto hace la carta más lenta: sigue cargando en menos de 5 segundos con
  3G (spec 002) y funciona sin JavaScript (sin animaciones).

### CA-4: Carrusel de promociones
- **Dado** una o más promociones visibles
- **Cuando** el cliente llega al final del inicio
- **Entonces** ve las imágenes en un carrusel que pasa solo cada 5 segundos, se puede
  deslizar con el dedo y muestra en qué imagen está.
- Y tiene un botón para **pausar** el pase automático (y se pausa solo mientras el
  cliente lo toca o desliza).
- Y sin promociones visibles, el espacio no aparece.

### CA-5: Ver una promoción en grande
- **Dado** el carrusel
- **Cuando** el cliente toca una imagen
- **Entonces** se abre a pantalla completa, sobre fondo negro, entera (sin recortes), con
  un botón **Cerrar** (también se cierra con la tecla Escape o el botón Atrás del
  celular) que vuelve al carrusel.

### CA-6: Promociones en el panel
- **Dado** el encargado en **Promociones** (panel)
- **Cuando** sube imágenes (JPG, PNG o WebP, hasta 5 MB; se achican antes de subir)
- **Entonces** aparecen en la lista, en el orden en que se ven en la carta.
- Y puede **ordenarlas arrastrando** (spec 005), **ocultarlas y mostrarlas** y
  **borrarlas** (con confirmación). Cada imagen lleva una **descripción** corta para
  quien usa lector de pantalla ("2x1 en espumantes").
- Y los cambios se ven en la carta al instante.
- Y solo el encargado entra a Promociones.

## Fuera de alcance
- Fechas de inicio y fin de cada promoción, enlaces a productos y texto sobre la imagen
  (la imagen va sola, como se diseñe).
- Promociones dentro de las secciones.
- Cambios en el panel (más allá de la pantalla de Promociones).
- Colores y tipografías nuevos.

## Preguntas abiertas
- [ ] ¿Las promociones llevan una **descripción** para lector de pantalla (CA-6)? Es
  una línea de texto que no se ve en la carta; la pide la accesibilidad (las imágenes
  necesitan texto alternativo). Propuesta: sí, obligatoria.

## Ideas para más adelante
- Fechas desde/hasta para que una promoción aparezca y desaparezca sola.
- Que una promoción lleve a un producto o a una sección.
