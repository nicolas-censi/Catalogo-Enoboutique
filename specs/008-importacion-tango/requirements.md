# 008 – Importación desde Tango

**Estado:** Aprobada (2026-10-29)

## Objetivo
Cargar la carta desde el reporte **"Precios por artículo"** de Tango (Excel o CSV) y
mantener los precios al día subiendo ese mismo reporte, sin cargar miles de artículos a
mano. Ver "Integración con Tango" en `specs/000-vision.md`.

## Lo que trae el reporte (archivo de referencia, 3.313 artículos)
- Columnas: `Cód. artículo`, `Descripción`, `Código de barras`, `Precio`. Sin stock ni
  sección ni bodega.
- El prefijo del código dice el tipo: `VI` vinos (2.590, de ellos 134 combos y boxes con
  código `VIkit…`), `BA` destilados (423), `AL` almacén (125), `AC` aceites (64), `AB`
  acetos (8), `AR` carnes (88), `PR` comidas (5), `01` gift cards (8), `CE` otros (2).
- Las letras 3 a 5 del código de un vino identifican la bodega (`VIrut…` Rutini; 172
  bodegas). Una misma bodega agrupa varias marcas (`zap`: Catena Zapata, DV Catena,
  Alamos, Saint Felicien…).
- La añada viene al final de la descripción (`RUTINI MAL 2020`) o antes del tamaño
  (`ZUCCARDI TITO BLEND 2014 MAGNUM`). Sin el año, los vinos forman unas 2.390 etiquetas;
  94 tienen más de un artículo.
- 1.205 artículos sin código de barras, 1 código inválido (`37726`), 58 precios en cero.

## Historias de usuario
- Como **encargado**, quiero **subir el reporte de Tango y ver qué va a cambiar antes de
  confirmar**, para no romper la carta por un archivo equivocado.
- Como **encargado**, quiero que **la primera importación arme la carta completa**
  (productos, añadas, bodegas, secciones y códigos de barras) con nombres legibles.
- Como **encargado**, quiero **actualizar los precios** subiendo el reporte cada tanto.

## Criterios de aceptación
### CA-1: Subir y revisar antes de importar
- **Dado** el encargado en **Importar desde Tango** (panel)
- **Cuando** sube el reporte (`.xlsx` o `.csv`)
- **Entonces** ve un resumen sin que nada cambie todavía: productos y añadas nuevos,
  precios que cambian (con el anterior y el nuevo), artículos sin cambios, artículos que
  no se importan por su tipo, artículos de la carta que no están en el archivo y
  problemas encontrados (por ejemplo, un código de barras inválido).
- Y recién al tocar **Importar** se aplica todo junto: si algo falla, no se aplica nada.
- Y si el archivo no tiene las cuatro columnas del reporte, se avisa cuáles faltan.
- Y solo el encargado puede importar.

### CA-2: Qué se importa
- **Dado** el reporte
- **Cuando** se importa
- **Entonces** entran los vinos (`VI`, incluidos combos y boxes), destilados (`BA`),
  almacén (`AL`), aceites (`AC`) y acetos (`AB`). No entran carnes (`AR`), comidas
  (`PR`), gift cards (`01`) ni otros (`CE`): se cuentan en el resumen como "no se
  importan".

### CA-3: Vinos y añadas
- **Dado** varios artículos de vino cuya descripción es igual salvo el año
- **Cuando** se importan
- **Entonces** forman **un producto** con una añada por artículo: con año si la
  descripción lo trae (al final o antes del tamaño), y "sin especificar" (marcada para
  revisar) si no.
- Y el tamaño separa productos: `ZUCCARDI TITO BLEND 2014 MAGNUM` no es una añada de
  `ZUCCARDI TITO BLEND`.
- Y los combos y boxes (`VIkit…`) son un producto cada uno, de tipo vino con una sola
  presentación sin añada.
- Y los demás tipos (destilados, almacén, aceites, acetos) son un producto cada uno, con
  una sola presentación sin añada.
- Y los códigos de barras van al producto (spec 001). Los inválidos se saltean y se
  listan como problema.

### CA-4: Nombres y varietal legibles
- **Dado** una descripción abreviada (`SALENTEIN PRIMUS MAL`, `TRAPICHE G MEDALLA CAB
  SAUV`)
- **Cuando** se crea el producto
- **Entonces** el nombre se escribe en mayúscula y minúscula y con las abreviaturas
  expandidas según el **diccionario de abreviaturas** ("Salentein Primus Malbec",
  "Trapiche Gran Medalla Cabernet Sauvignon"), y el varietal se completa cuando se
  reconoce (Malbec, Cabernet Sauvignon…).
- Y el diccionario inicial es la lista de abreviaturas armada por Lehonor (más algunas
  que aparecen en el reporte).
- Y el encargado puede ver y editar el diccionario desde el panel (agregar, cambiar o
  borrar abreviaturas). Los cambios se aplican a las próximas importaciones.
- Y la descripción original de Tango queda guardada en cada añada como referencia.

### CA-5: Bodegas
- **Dado** un vino con código `VIxxx…`
- **Cuando** se importa
- **Entonces** queda en la bodega que corresponde a esas tres letras.
- Y las bodegas vienen precargadas con la lista de Lehonor (140 códigos con su nombre).
  Para un código que no está en la lista, la importación propone un nombre (la marca
  más frecuente de esa bodega) que conviene revisar.
- Y el encargado ve en el panel la lista de **bodegas de Tango** (código, nombre y
  cantidad de productos) y puede corregir el nombre de cada una.
- Y los productos que no son vino quedan sin bodega.

### CA-6: Secciones automáticas
- **Dado** un producto nuevo
- **Cuando** se importa
- **Entonces** va a la sección que corresponde según su tipo y su descripción:
  destilados a **Destilados**; almacén, aceites y acetos a **Almacén**; combos y boxes a
  **Combos y boxes**; vinos con `ESP`, `BRUT`, `NAT` o `SIDRA` a **Espumantes**; con
  `ROSE` a **Rosados**; con varietales blancos (`CHARDO`, `SAUV BLANC`, `TORR`, `VIOG`,
  `RIESLING`, `SEM`, `BCO`…) a **Blancos**; con varietales tintos (`MAL`, `CAB`, `MER`,
  `SYRAH`, `P NOIR`, `BLEND`, `TANNAT`…) a **Tintos**.
- Y si una de esas secciones no existe, se crea (al final de la carta).
- Y lo que no se puede decidir queda **sin sección** (no se ve en la carta) y aparece
  en el panel con el filtro "Sin sección", para asignarlo a mano.
- Y si la sección elegida tiene subsecciones (spec 011), el producto queda sin sección,
  para que el personal elija la subsección.

### CA-7: Primera importación
- **Dado** una carta sin artículos de Tango todavía
- **Cuando** se importa el reporte
- **Entonces** todo entra **visible** y con sus añadas **disponibles** (el personal
  marca después lo que no hay), salvo lo que queda sin sección.

### CA-8: Actualizar precios y sumar lo nuevo
- **Dado** una carta que ya tiene artículos de Tango
- **Cuando** se importa un reporte nuevo
- **Entonces** el precio de cada añada existente se actualiza con el de Tango (pisa al
  del panel). No se tocan nombres, varietales, bodegas, secciones, fotos, descripciones,
  visibilidad ni stock.
- Y se suman los códigos de barras nuevos de cada producto.
- Y un artículo nuevo que es otra añada de un producto existente se suma a ese producto
  como **sin stock** (no se publica solo).
- Y un artículo nuevo de un producto nuevo se crea **oculto**, para revisar antes de
  publicarlo.
- Y los artículos de la carta que no están en el archivo no se modifican: solo se
  listan en el resumen.

### CA-9: Precios
- **Dado** un precio en cero o vacío en Tango
- **Cuando** se importa
- **Entonces** la añada queda sin precio y la carta muestra "Consultar precio"
  (spec 002).
- Y los precios se guardan con hasta dos decimales, como vienen.

### CA-10: Después de importar
- **Dado** una importación aplicada
- **Cuando** termina
- **Entonces** se ve un resumen de lo hecho (cuántos productos, añadas y precios) y la
  carta pública lo muestra al instante.
- Y en la lista de productos se pueden filtrar los que quedaron para revisar: sin
  sección, ocultos y con añadas "sin especificar".

### CA-11: Elegir la sección al importar
- **Dado** el resumen de una importación con productos nuevos
- **Cuando** el encargado lo revisa
- **Entonces** ve **todos** los productos nuevos (de a 50 por página), cada uno con un
  selector de sección que trae la sugerida (CA-6) y deja elegir cualquier sección o
  subsección, o "Sin sección".
- Y puede filtrar los que quedaron "Sin sección", tildar varios (o todos los de la
  página, o todos los del filtro) y ponerlos juntos en una sección.
- Y al tocar **Importar**, cada producto entra en la sección elegida.

### CA-12: Mover varios productos a una sección
- **Dado** la lista de productos del panel, con o sin filtros (por ejemplo, "Sin
  sección" o una búsqueda)
- **Cuando** el personal tilda varios productos (uno por uno, todos los de la página o
  **todos los que coinciden con el filtro**, aunque estén en varias páginas), elige una
  sección o subsección y toca **Mover**
- **Entonces** todos pasan a esa sección, la carta lo muestra al instante y se avisa
  cuántos se movieron ("Se movieron 294 productos a Tintos.").
- Y una sección que tiene subsecciones no se puede elegir (spec 011): se elige la
  subsección.
- Y un producto que era destacado deja de serlo al cambiar de sección (spec 005).

## Fuera de alcance
- Stock desde Tango (capacidad 10).
- Importar carnes, comidas, gift cards y otros (`AR`, `PR`, `01`, `CE`).
- Deshacer una importación.
- Conectarse a Tango directamente: siempre se sube el archivo exportado.
- Combinar o separar productos después de importar (se hace editando en el panel).

## Decisiones tomadas en la revisión
- **Qué entra:** vinos (con combos y boxes), destilados, almacén, aceites y acetos.
- **Secciones:** automáticas por tipo y descripción; lo dudoso queda sin sección.
- **Stock inicial:** disponible.
- **Combos y boxes:** tipo vino, una presentación sin añada, en su propia sección
  ("Combos y boxes"); el personal puede pasarlos a mano a otra (por ejemplo, Cava ›
  Experiencias).
- **Quién importa:** solo el encargado, por ahora.
- **Librería para leer Excel:** `read-excel-file` (solo lectura, liviana).
- **Elegir la sección de muchos productos juntos:** en Importar (antes de confirmar) y en
  la lista de Productos, tildando o con todos los del filtro (CA-11 y CA-12).
- **Nombres:** se expanden las abreviaturas y se escriben en mayúscula y minúscula;
  editables, y una nueva importación no los pisa.

## Ideas para más adelante
- Recordar la sección que el personal le asigna a una etiqueta para sugerirla en
  importaciones futuras de esa misma etiqueta.
