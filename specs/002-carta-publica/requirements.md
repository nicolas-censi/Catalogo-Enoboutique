# 002 – Carta pública con buscador

**Estado:** Implementada (2026-10-27)

## Objetivo
Que el cliente, desde su celular y dentro del local, encuentre rápido el vino (o el
producto) que tiene enfrente y vea sus añadas disponibles con el precio de cada una.
La carta muestra solo lo disponible, respeta el orden y las secciones que define el
personal, y el buscador tolera errores de tipeo y tildes.

## Historias de usuario
- Como **cliente**, quiero escribir el nombre del vino aunque no sepa cómo se escribe
  exactamente, para encontrarlo igual.
- Como **cliente**, quiero buscar por bodega o varietal, para ver las opciones que hay.
- Como **cliente**, quiero tipear el número del código de barras, para encontrar la
  botella que tengo en la mano si no puedo escanearla.
- Como **cliente**, quiero recorrer la carta por secciones, para ver qué hay sin saber
  qué busco.
- Como **cliente**, quiero ver el detalle de un vino con sus añadas, precios y
  descripción, para decidir cuál llevar.

## Criterios de aceptación

### CA-1: Inicio de la carta
- **Dado** un cliente que abre la carta en el celular (390×844)
- **Cuando** carga la página de inicio
- **Entonces** ve el logo de la marca, el buscador y la lista de secciones visibles en el
  orden definido por el personal. Las secciones sin productos disponibles no aparecen.

### CA-2: Productos de una sección
- **Dado** una sección con productos disponibles
- **Cuando** el cliente la abre
- **Entonces** ve sus productos en el orden definido por el personal. Cada producto
  muestra nombre, bodega y varietal (si los tiene) y sus añadas disponibles con el
  precio de cada una, de la más nueva a la más vieja.

### CA-3: Detalle de un producto
- **Dado** un producto disponible
- **Cuando** el cliente lo toca
- **Entonces** ve su página de detalle: foto (si tiene), nombre, bodega, varietal,
  descripción (si tiene) y todas sus añadas disponibles con su precio.
- Y esa página tiene una dirección propia (para que el escaneo de la spec 3 pueda
  llevar directo ahí).

### CA-4: Precios y añadas
- **Dado** una añada
- **Cuando** se muestra en la carta
- **Entonces**:
  - el precio sale en ARS con formato `es-AR` (ej.: `$ 47.000`), o "Consultar precio"
    si no tiene;
  - una añada "con año" muestra el año;
  - un producto "sin añada" (espumantes, destilados, aceites, almacén) muestra solo el
    precio;
  - una añada "sin especificar" se muestra igual que "sin añada": solo el precio, sin
    año. El personal le puede cargar el año más adelante desde el panel (spec 4).
- Y no se escribe "Disponible" en cada añada: lo agotado directamente no aparece.

### CA-5: Búsqueda tolerante a errores
- **Dado** los datos de ejemplo (seed)
- **Cuando** el cliente escribe en el buscador
- **Entonces** los resultados aparecen mientras escribe y encuentran el producto aunque:
  - tenga errores de tipeo: `rutni` → Rutini Malbec; `zucardi` → productos Zuccardi;
  - falten o sobren tildes, o cambien mayúsculas: `ALMACEN`, `salentéin`;
  - busque por bodega (`salentein`), por varietal (`malbec`, `sauvignon`) o por parte del
    nombre (`primus`).
- Y los resultados más parecidos aparecen primero.

### CA-6: Búsqueda por código de barras
- **Dado** un código de barras asociado a un producto disponible
- **Cuando** el cliente escribe ese número completo en el buscador
- **Entonces** ve ese producto con todas sus añadas disponibles.

### CA-7: Sin resultados
- **Dado** una búsqueda que no encuentra nada
- **Cuando** termina de buscar
- **Entonces** ve un mensaje amable que lo invita a probar con otro nombre o a
  consultar al personal.

### CA-8: Solo lo disponible
- **Dado** productos ocultos, sin stock o de secciones ocultas
- **Cuando** el cliente navega o busca
- **Entonces** no los encuentra por ningún camino (inicio, sección, detalle o buscador).
  La dirección del detalle de un producto no disponible muestra "No encontramos este
  producto" en vez de sus datos.

### CA-9: Rápida con mala señal
- **Dado** el celular con red lenta (simulación 3G rápida en Playwright)
- **Cuando** se abre el inicio o una sección
- **Entonces** el contenido se ve sin esperar a que cargue JavaScript (se arma en el
  servidor) y el buscador solo pide al servidor los resultados, no la carta entera.

### CA-10: Cambios del personal visibles
- **Dado** un cambio hecho por el personal (precio, stock, orden u ocultar)
- **Cuando** pasa como máximo 1 minuto
- **Entonces** la carta lo refleja.

### CA-11: Marca y accesibilidad
- **Dado** cualquier pantalla de la carta
- **Cuando** se revisa
- **Entonces** usa solo los tokens de marca, los textos están en español rioplatense,
  los elementos tocables miden al menos 44×44 px y la herramienta de accesibilidad
  automática (axe) no reporta errores graves.

## Fuera de alcance
- Escaneo con la cámara (spec 3).
- Subir fotos y editar textos (specs 4 y 6). Si un producto no tiene foto, se muestra
  sin foto.
- Filtros avanzados (por precio, por bodega, etc.).
- Favoritos, compartir o cualquier interacción que no sea ver y buscar.
- Idiomas además del español.

## Decisiones tomadas en la revisión
- **Inicio:** arranca con la lista de secciones.
- **Añadas "sin especificar":** se muestran sin año. Cargarles el año a mano es parte
  del panel (spec 4).
- **Leyenda "Disponible":** no se muestra; lo agotado no aparece.
- **Demora de los cambios:** hasta 1 minuto está bien.

## Ideas para más adelante
- Mostrar las añadas agotadas como "Agotada" (hoy se esconden).
- Sugerencias de búsqueda ("¿quisiste decir…?").
