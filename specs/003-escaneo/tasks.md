# 003 – Tareas

Cada tarea: máximo 30 minutos, verificable con un test, referenciada a un criterio (CA-n).

- [x] T1 — `lib/escaneo.ts`: dígito verificador EAN/UPC, normalización y mensajes de
  error de cámara; tests unitarios. (CA-2, CA-4)
- [x] T2 — Videos `.y4m` de prueba con códigos de barras y configuración de Playwright
  con cámara simulada; test que verifica que el video llega. (CA-2)
- [ ] T3 — `BotonEscanear` circular con ícono al costado del buscador del inicio; página
  `/escanear` sin JS con ingreso manual; e2e. (CA-1, CA-4)
- [ ] T4 — `Escaner`: cámara trasera, guía de encuadre, lectura con `BarcodeDetector`
  nativo; al leer, vibra y navega al detalle; e2e con cámara simulada. (CA-2)
- [ ] T5 — Ponyfill `barcode-detector` con el `.wasm` servido desde el sitio y carga
  solo al abrir el escáner; e2e forzando el ponyfill. (CA-2, CA-6)
- [ ] T6 — Código inexistente: mensaje, reintentar y buscar por nombre; e2e. (CA-3)
- [ ] T7 — Permiso denegado / sin cámara: explicación e ingreso manual; e2e. (CA-4)
- [ ] T8 — Cerrar y salir apagan la cámara; e2e que verifica la pista `ended`. (CA-5)
- [ ] T9 — Carga diferida y privacidad: e2e de pedidos de red (sin archivos del lector
  en la carta, sin imágenes enviadas). (CA-6, CA-7)
- [ ] T10 — Accesibilidad: anuncios, nombres y axe; prueba manual en iPhone y Android
  reales. (CA-8)
