# 000 – Visión del producto

**Estado:** Aprobada (2026-10-23)

## El problema
En la vinoteca, especialmente en la cava, una misma etiqueta existe en varias añadas
con precios distintos. En Tango cada añada es un artículo aparte, y la mayoría no tiene
código de barras propio. Hoy el cliente no tiene una forma simple de ver qué añadas hay
y cuánto cuesta cada una.

## La solución
Una carta virtual que el cliente abre escaneando un QR en el local. Desde ahí puede
buscar el vino que tiene enfrente y ver imagen, añadas disponibles, precio de cada una
y una descripción. El personal administra todo desde un panel simple, sin tocar código.

## Usuarios
- **Cliente en el local**: usa su celular, quiere encontrar rápido el vino y su precio.
- **Encargado**: carga y edita vinos, añadas, precios, fotos y el orden de la carta.
  Aprueba las descripciones sugeridas por la IA.
- **Vendedor**: accede al panel con los mismos permisos que el Encargado.

## Capacidades (cada una será una spec)
1. Modelo de datos Vino → Añadas y proyecto base
2. Carta pública con buscador tolerante a errores (nombre, bodega, varietal, código)
3. Escaneo de código de barras con la cámara del celular
4. Panel admin con login: alta, edición, fotos, ocultar/mostrar
5. Orden visual de secciones y vinos (arrastrar y soltar)
6. Identidad de marca y textos editables de la carta
7. Descripciones sugeridas por IA con búsqueda web → borrador → aprobación humana
8. Importación masiva desde CSV/Excel de Tango (agrupando añadas por nombre) y
   actualización masiva de precios por código de artículo
9. Deploy, dominio y QR imprimible
10. (Más adelante) Actualización masiva de stock desde un reporte de Tango

## Principios
- **Lo humano manda**: todo dato es editable desde el panel; la IA solo sugiere.
- **Solo se publica lo aprobado**: ninguna descripción de IA llega a la carta sin revisión.
- **Mobile-first y rápido**: tiene que cargar bien con la señal de adentro del local.
- **Con la estética de la marca**: colores, tipografía y logo propios.

## Fuera de alcance (por ahora)
Venta online, carrito, pagos, gestión de stock contable, maridajes automáticos.

## Datos del negocio
- **Nombre en la carta:** Lehonor Enoboutique.
- **Sistema de stock/caja:** Tango Punto de Venta. Exporta a CSV y Excel.
  Export de referencia: "Precios por artículo" con las columnas `Cód. artículo`,
  `Descripción`, `Código de barras` y `Precio`. **No trae stock ni añada en columnas
  separadas.**
- **Secciones de la carta:** configurables desde el panel (alta, nombre, orden). No hay
  una lista fija.
- **Volumen** (según el export de referencia, 3.313 artículos en total):
  - 2.590 artículos de vino (prefijo `VI`) de unas 170 bodegas, que forman unas
    2.400 etiquetas.
  - 95 etiquetas tienen más de una añada, con un máximo de 10 añadas por etiqueta.
  - El resto son destilados (`BA`), almacén (`AL`), carnes (`AR`), aceites (`AC`),
    acetos (`AB`), gift cards (`01`), comidas (`PR`) y otros (`CE`).
- **Stock al cliente:** se muestra solo "Disponible" o "Sin stock", nunca la cantidad.
- **Añadas sin stock:** se esconden. Si un vino se queda sin ninguna añada con stock,
  se esconde el vino entero.
- **Familias en la carta:** vinos (`VI`), destilados (`BA`), aceites (`AC`) y
  almacén (`AL`, incluye los acetos `AB`). Las otras familias (carnes, comidas, gift
  cards, etc.) no entran. Los productos que no son vino no tienen añadas: se muestran
  con un único precio.
- **Dominio:** `enoboutique.lehonor.com`. El DNS de `lehonor.com` lo gestiona el
  propio negocio.
- **Marca** (tomada de https://www.lehonor.com/enoboutique):
  - **Tema oscuro** (elegido entre 4 previews, opción 2B, con fondo negro puro):
    - Fondo negro `#000000`; tarjetas y buscador `#1C1C1C`. Se descartó el casi negro
      `#111111` porque en pantallas Samsung se veía verdoso.
    - Dorado de marca (el del logo) `#B19750`: logo, títulos, nombres de vinos,
      secciones, precios, enlaces y botones. Sobre el fondo negro tiene contraste 7,4:1.
    - Crema `#F3EDE0`: texto secundario (bodega · varietal, años, ayudas).
  - Tipografías (Google Fonts): **Inknut Antiqua** para títulos y **Cabin** para el
    texto.
  - Logo: "LEHONOR / ENO boutique" en dorado, en `marca/logo-enoboutique.png`
    (PNG de 1920×1080 con fondo transparente).

## Integración con Tango
- **El código de artículo de Tango (`Cód. artículo`) es la clave** que une cada
  añada/producto de la carta con Tango. Todos los cruces se hacen por ese código.
- **Importación inicial:** desde el reporte "Precios por artículo" (CSV o Excel). La
  importación agrupa las añadas por nombre y expande las abreviaturas; el personal
  revisa ambas cosas antes de publicar.
- **Actualización masiva de precios:** periódicamente se sube el mismo reporte de
  precios. Los precios se actualizan por código de artículo, y **el precio de Tango
  pisa al del panel**. Los códigos nuevos que no existen en la carta quedan como
  pendientes de revisión, y no se publican solos.
- **Stock: manual por ahora.** El stock de Tango hoy no refleja la realidad, así que la
  disponibilidad ("Disponible" / "Sin stock") de cada añada la marca el personal a mano
  desde el panel (spec 4).
- **Stock desde Tango (más adelante):** cuando el stock de Tango esté ajustado, se podrá
  subir un reporte de stock de Tango y actualizar la disponibilidad por código de
  artículo (capacidad 10). El modelo de datos ya lo permite. El archivo de ejemplo de
  ese reporte llega con esa spec.
- **Stock al importar:** la importación inicial (spec 8) carga todas las añadas como
  "Disponible", y el personal marca a mano las que no hay.

## Lo que muestra el export de Tango (impacta la regla de dominio)
- **Cada añada es un artículo distinto en Tango**, con código y precio propios. La
  añada viene dentro de la descripción (ej.: `RUTINI MAL 2020`, `RUTINI MAL 2018`).
- **Los códigos de barras no se repiten**: ningún código aparece en dos filas. 1.205
  artículos no tienen código, entre ellos casi todas las añadas viejas.
- Por eso **no se puede agrupar por código de barras**: la agrupación Vino → Añadas
  tiene que salir del nombre sin el año, con revisión humana en la importación.
- Las descripciones vienen abreviadas y en mayúsculas (`MAL`, `CAB SAUV`, `RVA`,
  `CHARDO`, `G CORTE`).
- Hay 14 descripciones idénticas repetidas con precios distintos (ej.:
  `ZUCCARDI Q MAL` sin año, dos veces).
- 58 artículos tienen precio vacío o en cero.

## Decisiones sobre los datos de Tango
- **Escaneo:** al escanear el código de una botella se ve el vino con todas sus
  añadas disponibles, aunque solo una añada tenga código de barras en Tango. El código
  de barras queda asociado al Vino.
- **Nombres:** la carta muestra un nombre editable y legible (ej.: "Rutini Malbec").
  La descripción de Tango queda como referencia interna. La importación expande las
  abreviaturas (`MAL` → Malbec) con un diccionario editable, y el personal revisa el
  resultado.
- **Artículos sin año en la descripción:** se importan como añada "sin especificar",
  marcados para revisión. El personal les asigna el año o los deja como "sin añada"
  (ej.: espumantes, destilados).
