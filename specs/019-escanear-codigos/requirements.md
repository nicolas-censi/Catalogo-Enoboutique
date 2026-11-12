# 019 – Escanear códigos de barras desde el panel

**Estado:** Aprobada (2026-11-12)

## Objetivo
Que el personal cargue el código de barras de un producto apuntando la cámara del celular
a la botella, en lugar de tipear los 13 dígitos. Es más rápido y evita errores de tipeo.
Retoma la idea anotada en la spec 003 ("Escanear desde el panel para cargar el código de
barras de un producto").

## Historias de usuario
- Como **vendedor**, quiero **escanear la botella desde la ficha del producto** para
  cargarle el código de barras sin escribirlo.
- Como **vendedor**, quiero **recorrer la cava con el celular, escanear una botella y
  llegar a su producto** para saber si ya tiene el código cargado o cargárselo.

## Criterios de aceptación
### CA-1: Escanear en la ficha
- **Dado** la pestaña Códigos de barras de un producto, en el celular
- **Cuando** el vendedor toca **Escanear con la cámara** y apunta al código de la botella
- **Entonces** el celular vibra, la cámara se cierra y el código se agrega al producto, con
  el aviso "Se agregó el código 7790000000000.".
- Y queda el botón **Escanear otro**, por si la botella tiene más de un código.
- Y si el código ya es de otro producto, no se agrega y se avisa de cuál (como hoy al
  escribirlo). Si ya era de este producto, se avisa que ya estaba.
- Y solo se aceptan códigos de botella válidos (EAN-13, EAN-8, UPC-A, UPC-E con el dígito
  verificador correcto), igual que el escáner de la carta: una lectura a medias se ignora.

### CA-2: Escanear desde la lista de productos
- **Dado** la lista de Productos
- **Cuando** el vendedor toca el botón de escanear del buscador y apunta a una botella
- **Entonces**, si el código ya está cargado, se abre la ficha de ese producto.
- Y si no está cargado, se ve "Ningún producto tiene el código 7790000000000." con el
  buscador listo para encontrar el producto por nombre; al abrir su ficha, la pestaña
  Códigos de barras ofrece **Agregar 7790000000000** con un toque.

### CA-3: Sin cámara o sin permiso
- **Dado** un dispositivo sin cámara, o sin permiso para usarla
- **Cuando** se toca escanear
- **Entonces** se ve el mismo mensaje que en la carta (cómo habilitar el permiso), y se puede
  seguir escribiendo el código a mano como hasta ahora.
- Y al cerrar el escáner o salir de la pantalla, la cámara se apaga.

### CA-4: Accesibilidad y celular
- **Dado** el escáner del panel
- **Cuando** se usa en el celular (390 px) o con lector de pantalla
- **Entonces** los botones miden al menos 44 px, el estado ("Buscando un código…",
  "Se agregó…") se anuncia y axe no reporta errores graves.

## Fuera de alcance
- Escanear varios códigos seguidos sin tocar nada entre uno y otro.
- Leer el código de Tango o códigos QR.

## Preguntas abiertas
- [x] ¿Sumamos también el escaneo desde la lista de productos (CA-2), o alcanza con el de
  la ficha (CA-1)? → Los dos (aprobado el 2026-11-12).

## Ideas para más adelante
- Modo "recorrer la cava": escanear una botella tras otra y asignar las que no tienen
  producto sin salir del escáner.
