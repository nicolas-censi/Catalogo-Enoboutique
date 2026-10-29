# 008 – Diseño técnico

## Flujo
1. El encargado sube el archivo en `/admin/importar` (Server Action).
2. El servidor lo lee (`read-excel-file` para `.xlsx`; CSV con separador `;` o `,`) y
   arma un **plan** con funciones puras (`lib/tango/`): qué productos, añadas, bodegas,
   secciones y códigos se crean y qué precios cambian. No toca la base.
3. La pantalla muestra el resumen del plan (CA-1). El plan se guarda en la base
   (`importaciones`, con el archivo ya interpretado) y se identifica por su id.
4. Al tocar **Importar**, una función de la base `aplicar_importacion(id)` aplica el plan
   en una sola transacción (CA-1) y vuelve a verificar contra el estado actual (si alguien
   cambió algo entre el resumen y la confirmación, el plan se recalcula y se vuelve a
   mostrar).
5. `invalidarCarta()` (CA-10).

## Funciones puras (`lib/tango/`, con tests unitarios)
- `leerReporte(filas)`: valida columnas, normaliza códigos y precios (0 o vacío → null).
- `tipoPorCodigo(codigo)`: `VI` vino (o combo si `VIkit`), `BA` destilado, `AL`/`AB`
  almacén, `AC` aceite; el resto no se importa (CA-2).
- `separarAnada(descripcion)`: año al final o antes de un tamaño (`MAGNUM`, `DOBMAGNUM`,
  `1500`, `1500CC`, `375CC`…) → `{ clave, anio }`. Un año en otra posición
  (`LAS FINCAS 1955 MAL`) es parte del nombre (CA-3).
- `nombreLegible(descripcion, diccionario)` y `varietal(descripcion, diccionario)` (CA-4).
- `seccionSugerida(tipo, descripcion)` con las reglas de CA-6.
- `bodegaPorCodigo(codigo)` → las letras 3 a 5; `nombreSugeridoBodega(descripciones)` →
  la primera palabra más frecuente, legible (CA-5).
- `planear(reporte, estadoActual, diccionario)` → el plan completo (CA-3, CA-7, CA-8).

## Datos
- `abreviaturas` (`abreviatura` text pk, `expansion` text, `es_varietal` bool): el
  diccionario (CA-4). Se carga con una lista inicial (MAL → Malbec, CAB SAUV → Cabernet
  Sauvignon, RVA → Reserva, G → Gran…). Solo el personal lee; el encargado edita.
- `bodegas.codigo_tango` text unique null (CA-5).
- `importaciones` (id, creada_en, creada_por, estado `pendiente`/`aplicada`, `plan`
  jsonb, `resumen` jsonb): el plan entre el resumen y la confirmación, y el registro de
  lo aplicado. Solo el encargado.
- Sin cambios en `productos` ni `anadas`: el vínculo con Tango es `anadas.codigo_tango`
  (único) y la agrupación de un artículo nuevo con un producto existente se hace por la
  clave (`separarAnada`) de las descripciones de Tango de sus añadas.

## Rutas y pantallas
| Ruta | Quién | Qué |
|------|-------|-----|
| `/admin/importar` | encargado | subir archivo, resumen del plan, Importar, resultado (CA-1, CA-10) |
| `/admin/importar/abreviaturas` | encargado | diccionario editable (CA-4) |
| `/admin/importar/bodegas` | encargado | bodegas de Tango: código, nombre, productos; renombrar (CA-5) |
| `/admin` | personal | filtro "Sin sección" (CA-6, CA-10) |

## Elegir secciones (CA-11 y CA-12)
- El plan guarda, por producto nuevo, `seccion` (nombre, para las secciones que crea la
  importación) o `seccionId` (una sección o subsección que ya existe). Al confirmar, el
  servidor aplica las elecciones del encargado al plan guardado y recién ahí lo aplica.
  `aplicar_importacion` usa `seccionId` si viene.
- El resumen trae todos los productos nuevos (nombre y sección sugerida) y la lista de
  secciones y subsecciones elegibles. La tabla se pagina en el navegador.
- Lista de Productos: acción de servidor `moverProductos` que recibe ids tildados o los
  filtros actuales (para "todos los del filtro" se recalculan los ids en el servidor,
  todas las páginas) y la sección; actualiza de a tandas.

## Decisiones y alternativas descartadas
- **Plan en dos pasos (resumen → confirmar)** en vez de importar directo: el archivo
  puede venir mal y la carta es pública.
- **Aplicar en una función de la base** en vez de miles de pedidos desde el servidor: es
  atómico y rápido (3.300 filas en una transacción).
- **Agrupar por descripción sin el año** (no por código de barras): ver la visión.

## Riesgos
- Reglas de nombres y secciones imperfectas: por eso todo es editable y lo dudoso
  queda marcado. Se prueban con el archivo real (sin subirlo al repositorio: se usa una
  muestra anonimizada en los tests).
- Tamaño del archivo: el reporte pesa ~200 KB; límite de subida 4 MB (Vercel admite
  hasta 4,5 MB por pedido).
