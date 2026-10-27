# 003 – Diseño técnico

## Datos
No hay cambios en la base. El escáner usa la función pública
`buscar_por_codigo_barras(codigo)` de la spec 001 (devuelve el producto con todas sus
añadas disponibles, o nada si el código no existe, está oculto o sin stock).

## Rutas y pantallas
| Ruta | Quién la usa | Qué muestra |
|------|--------------|-------------|
| `/escanear` | cliente | escáner a pantalla completa (CA-2 a CA-5, CA-8) |

El botón "Escanear código" es un enlace a `/escanear` (funciona aunque falle JS: la
página explica que hace falta JavaScript para usar la cámara y ofrece escribir el
número, que va a `/buscar?q=<número>`).

## Componentes
- `BotonEscanear`: enlace circular (44×44 px o más) al costado del buscador del inicio,
  con un ícono SVG de escáner de código de barras en dorado y `aria-label="Escanear
  código"`.
- `Escaner` (Client Component, cargado con `next/dynamic` solo en `/escanear`):
  1. Pide la cámara trasera con `getUserMedia({ video: { facingMode: "environment" } })`.
  2. Muestra el video con una guía para encuadrar.
  3. Lee cuadros del video ~5 veces por segundo con `BarcodeDetector`:
     - nativo si el navegador lo trae y soporta los formatos;
     - si no, el ponyfill `barcode-detector` (ZXing compilado a WebAssembly). El
       archivo `.wasm` se copia a `public/` y se sirve desde el propio sitio (no desde un
       CDN), configurando la librería para que lo busque ahí.
  4. Al leer un código válido (EAN-13/EAN-8/UPC-A/UPC-E, con dígito verificador
     correcto), vibra, apaga la cámara y consulta `buscar_por_codigo_barras`:
     - si hay resultado, navega a `/producto/<id>`;
     - si no, muestra "No encontramos ese código" con opciones de reintentar o buscar.
  5. Al cerrar o salir (`useEffect` de limpieza, `pagehide`), detiene todas las pistas
     del video.
- `IngresoManualCodigo`: campo para escribir el número (CA-4), que hace la misma
  consulta.
- `lib/escaneo.ts` (funciones puras, testeadas): validación del dígito verificador
  EAN/UPC, normalización (UPC-A → EAN-13 con 0 adelante) y mensajes según el error de
  la cámara (`NotAllowedError`, `NotFoundError`, `NotReadableError`).
- Textos nuevos en `lib/textos.ts` (sección `escaner`).

## Tests
- **Unit (Vitest):** dígito verificador, normalización y mensajes de error.
- **E2E (Playwright, viewport de celular):** Chromium con cámara simulada
  (`--use-fake-device-for-media-stream` y `--use-file-for-fake-video-capture` con un
  video `.y4m` generado con el código de barras de Salentein Primus Malbec del seed, y
  otro con un código inexistente) y permiso de cámara concedido:
  - escanear lleva al detalle (CA-2);
  - código inexistente muestra el mensaje y permite reintentar o buscar (CA-3);
  - permiso denegado muestra la explicación y el ingreso manual funciona (CA-4);
  - al cerrar, la pista de video queda en estado `ended` (CA-5);
  - la carta sin abrir el escáner no descarga los archivos del lector (CA-6);
  - no se hace ningún pedido con imágenes, solo la consulta del número (CA-7);
  - axe en el escáner (CA-8).
- Se fuerza el uso del ponyfill en un test (simulando que no hay `BarcodeDetector`
  nativo), para cubrir el camino de iPhone.

## Decisiones y alternativas descartadas
- **`BarcodeDetector` nativo + ponyfill ZXing:** cubre Android (rápido, nativo) e
  iPhone (WebAssembly). Se descartó QuaggaJS (sin mantenimiento) y escanear en el
  servidor (mandar imágenes: lento con mala señal y peor para la privacidad).
- **Página `/escanear` en vez de un modal:** tiene dirección propia, el botón "atrás"
  del celular cierra el escáner y libera la cámara de forma natural.
- **Validar el dígito verificador:** evita lecturas parciales o erróneas antes de
  buscar.

## Riesgos
- **iPhone:** Safari exige HTTPS (Vercel lo da) y gesto del usuario; se prueba en un
  iPhone real antes de cerrar.
- **Luz del local:** con poca luz cuesta más leer; la guía de encuadre y el ingreso
  manual cubren el caso.
