# 000 – Visión del producto

**Estado:** Borrador (quedan puntos marcados con ⚠️)

## El problema
En la vinoteca, especialmente en la cava, una misma etiqueta existe en varias añadas
con precios distintos pero con el **mismo código de barras**. Hoy el cliente no tiene
una forma simple de ver qué añadas hay y cuánto cuesta cada una.

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
8. Importación masiva desde CSV/Excel, agrupando por código de barras
9. Deploy, dominio y QR imprimible

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
- **Dominio:** un subdominio de `lehonor.com`. ⚠️ Falta definir el nombre del
  subdominio y quién gestiona el DNS.
- ⚠️ Colores de marca (hex), tipografías y logo: la web
  https://www.lehonor.com/enoboutique no se pudo consultar desde el entorno de trabajo.

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

## Preguntas abiertas
- ⚠️ ¿Qué familias entran en la carta? ¿Solo vinos (`VI`), o también destilados,
  aceites, almacén, etc.?
- ⚠️ **Stock:** este export no trae stock. ¿Tango puede exportar stock por artículo
  (otro reporte)? Si no, ¿la disponibilidad se marca a mano en el panel?
- ⚠️ **Código de barras:** ¿al escanear una botella, el cliente debería ver todas las
  añadas del vino aunque solo la añada actual tenga el código cargado en Tango?
  (Propuesta: sí. El código queda en el Vino y las añadas sin código se asocian por
  nombre.)
- ⚠️ **Nombres:** ¿la carta muestra un nombre "lindo" editable (ej.: "Rutini Malbec")
  mientras el nombre de Tango queda solo como referencia interna? ¿Querés que la
  importación expanda las abreviaturas automáticamente (`MAL` → Malbec), con revisión?
- ⚠️ **Sincronización con Tango:** ¿la importación es solo una vez al inicio, o se
  repite periódicamente para actualizar precios? Si se repite, ¿Tango manda sobre los
  precios, o los cambios hechos en el panel se respetan?
- ⚠️ **Artículos sin año en la descripción** (ej.: `ZUCCARDI Q MAL`): ¿son la añada
  actual, o una añada sin especificar ("NV")?
