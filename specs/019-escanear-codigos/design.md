# 019 – Diseño técnico

## Reutilizar el escáner de la carta
- Se extrae de `components/Escaner.tsx` la parte de cámara y lectura a un hook
  `useLectorCamara({ alLeer })` (`components/useLectorCamara.ts`): pide la cámara trasera,
  enfoque continuo, lee cada 100 ms con `crearLector()` (BarcodeDetector nativo o ZXing
  desde el propio sitio), acepta solo `codigoValido`, vibra, apaga la cámara y devuelve el
  estado (`iniciando`, `escaneando`, `error` con el mensaje de `mensajeErrorCamara`) y un
  `reintentar()`. La cámara se apaga al desmontar y en `pagehide`.
- `Escaner` (carta) pasa a usar el hook, sin cambios visibles.
- `EscanerPanel` (nuevo, `components/admin/EscanerPanel.tsx`): un `<dialog>` con el video,
  la guía para encuadrar, el estado y Cerrar. Se importa con `next/dynamic`, así ZXing se
  descarga solo al tocar escanear.

## Ficha (CA-1)
- `EditorCodigos` suma el botón **Escanear con la cámara** (ícono de código de barras) al
  lado de Agregar. Al leer, llama a una acción nueva `agregarCodigoEscaneado(productoId,
  codigo)` que reusa la validación y los mensajes de `agregarCodigo` (código repetido,
  de otro producto), y además prueba las variantes de `variantesCodigo` para detectar
  si ya estaba cargado con o sin el 0 adelante.
- Parámetro `?codigo=…` en la ficha (desde CA-2): la pestaña Códigos muestra
  **Agregar 7790000000000** si el producto todavía no lo tiene.

## Lista de productos (CA-2)
- Botón de escanear dentro del buscador de Productos. Al leer: acción
  `buscarPorCodigo(codigo)` (personal, ve también ocultos y sin stock; prueba las
  variantes). Si hay producto → `router.push(/admin/productos/{id}?pestana=codigos)`.
  Si no → aviso con el código y el foco en el buscador; los enlaces de la lista llevan
  `?codigo=…` mientras dure ese aviso.

## Datos
Sin cambios: tabla `codigos_barras` (spec 001, 004).

## Tests
- Unit: `agregarCodigoEscaneado` y `buscarPorCodigo` con variantes (12 y 13 dígitos).
- E2E con lector simulado (como `escaner.spec.ts`, BarcodeDetector falso): ficha →
  escanear → se agrega; código de otro producto → aviso; lista → escanear código
  existente → abre la ficha; código nuevo → aviso y "Agregar …" en la ficha; sin
  permiso de cámara → mensaje; axe y 390 px.
