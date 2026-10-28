# 003 – Escaneo de código de barras con la cámara

**Estado:** Aprobada (2026-10-28)

## Objetivo
Que el cliente, en el local, apunte la cámara del celular al código de barras de la
botella que tiene en la mano y vea al instante ese vino con todas sus añadas
disponibles y sus precios, sin tener que escribir nada.

## Historias de usuario
- Como **cliente**, quiero escanear el código de la botella con la cámara, para ver
  sus añadas y precios sin buscarla por nombre.
- Como **cliente**, si el código no está en la carta, quiero que me lo diga y me
  ofrezca buscar por nombre, para no quedarme trabado.
- Como **cliente**, si no di permiso a la cámara o mi celular no puede escanear,
  quiero una alternativa (escribir el número), para poder encontrar la botella igual.

## Criterios de aceptación

### CA-1: Botón para escanear
- **Dado** un cliente en el inicio de la carta, en un celular
- **Cuando** mira el buscador
- **Entonces** ve, al costado del buscador, un botón circular con un ícono de escáner
  de código de barras, cuyo nombre accesible es "Escanear código".
- Y el botón aparece solo en el inicio.

### CA-2: Escanear y ver el producto
- **Dado** un código de barras asociado a un producto disponible (por ejemplo, el de
  Salentein Primus Malbec)
- **Cuando** el cliente toca "Escanear código", da permiso a la cámara y la apunta al
  código
- **Entonces** ve la imagen de la cámara con una guía para encuadrar el código y, al
  reconocerlo, la carta lo lleva sola al detalle de ese producto con todas sus añadas
  disponibles.
- Y el celular vibra brevemente al reconocerlo (si lo permite).
- Y se reconocen los códigos de las botellas: EAN-13, EAN-8, UPC-A y UPC-E.

### CA-3: Código que no está en la carta
- **Dado** un código que no está en la carta (o es de un producto oculto o sin stock)
- **Cuando** el cliente lo escanea
- **Entonces** ve "No encontramos ese código en la carta" con el número leído, y puede
  volver a escanear o buscar por nombre.
- Y no se revela si el producto existe pero está oculto o sin stock.

### CA-4: Sin permiso de cámara o sin cámara
- **Dado** un cliente que no da permiso a la cámara, o un dispositivo sin cámara
- **Cuando** toca "Escanear código"
- **Entonces** ve una explicación de cómo habilitar la cámara (según el navegador) y un
  campo para escribir el número del código, que lo lleva al mismo resultado.

### CA-5: Cerrar el escáner
- **Dado** el escáner abierto
- **Cuando** el cliente toca "Cerrar" o vuelve atrás
- **Entonces** la cámara se apaga (se libera, se apaga la luz de la cámara) y vuelve a
  la carta.

### CA-6: No pesa en la carta
- **Dado** un cliente que nunca toca "Escanear código"
- **Cuando** usa la carta
- **Entonces** no descarga nada del escáner: el lector de códigos se carga recién al
  abrirlo (CA-9 de la spec 002 se sigue cumpliendo).

### CA-7: Privacidad
- **Dado** el escáner abierto
- **Cuando** lee la imagen de la cámara
- **Entonces** todo se procesa en el celular: no se manda ninguna imagen a ningún
  servidor, solo el número leído para buscarlo.

### CA-8: Accesible
- **Dado** el escáner
- **Cuando** se usa con un lector de pantalla
- **Entonces** los botones tienen nombre, el resultado se anuncia ("Encontramos Rutini
  Malbec") y axe no reporta errores graves.

### CA-9: Linterna
- **Dado** el escáner abierto en un celular cuya cámara tiene linterna y el navegador
  permite usarla (Chrome en Android)
- **Cuando** el cliente toca "Prender linterna"
- **Entonces** se prende el flash para iluminar el código, y el mismo botón ("Apagar
  linterna") lo apaga. Al cerrar el escáner, la linterna se apaga con la cámara.
- Y si el navegador no permite la linterna (Safari en iPhone), el botón no aparece.

### CA-10: Lectura con la luz del local
- **Dado** el escáner abierto
- **Cuando** se abre la cámara
- **Entonces** se pide la cámara trasera en alta resolución (hasta 1920×1080) y con
  enfoque automático continuo cuando el celular lo permite, para leer mejor los códigos
  chicos o con poca luz.

## Fuera de alcance
- Escanear el QR de la mesa o del local (el QR que abre la carta lo lee la cámara del
  celular por su cuenta; spec 9).
- Escanear desde el panel de administración para cargar códigos (se puede sumar más
  adelante).
- Zoom o elegir otra cámara.

## Decisiones tomadas en la revisión
- **Librería:** aprobada. Se usa el lector del navegador cuando existe y, si no,
  `barcode-detector` (ZXing), servida desde el propio sitio.
- **Botón:** solo en el inicio, al costado del buscador, circular y con un ícono de
  escáner.
- **Linterna (prueba en Android real):** se agrega un botón para prender el flash
  (CA-9), y se pide más resolución y enfoque continuo (CA-10).

## Ideas para más adelante
- Escanear desde el panel para cargar el código de barras de un producto.
- Recordar los últimos productos escaneados en el celular del cliente.
