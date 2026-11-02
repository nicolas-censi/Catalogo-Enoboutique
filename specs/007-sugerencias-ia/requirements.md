# 007 – Sugerencias por IA (descripción y foto)

**Estado:** Aprobada (2026-11-02)

## Objetivo
Que el personal complete la carta sin escribir a mano ni buscar fotos de a una:
para cada vino (o producto), la IA busca en la web y **propone** una descripción corta
y la foto oficial de la etiqueta. Nada llega a la carta sin que una persona lo revise y
lo apruebe ("Lo humano manda" y "Solo se publica lo aprobado", visión).

## Historias de usuario
- Como **encargado o vendedor**, quiero **tocar "Sugerir con IA" en la ficha de un
  vino** y ver en un rato una descripción y una foto propuestas, para completarlo rápido.
- Como **encargado o vendedor**, quiero **pedir sugerencias para muchos vinos a la vez**
  (tildados o todos los del filtro), para completar la carta entera sin ir uno por uno.
- Como **encargado o vendedor**, quiero **revisar, corregir y aprobar o descartar** cada
  sugerencia, para que en la carta solo haya información correcta.

## Criterios de aceptación
### CA-1: Sugerencia de a uno
- **Dado** la ficha de un producto en el panel
- **Cuando** alguien del personal toca **Sugerir con IA**
- **Entonces** ve "Buscando información… puede tardar hasta un minuto." y, al terminar,
  la sugerencia aparece en la misma ficha para revisar (CA-5).
- Y si la ficha ya tiene una sugerencia esperando revisión, el botón la muestra en vez
  de pedir otra.
- Y si falla (sin conexión, sin saldo, límite de uso), ve "No se pudo pedir la
  sugerencia. Probá de nuevo más tarde." y la ficha queda como estaba.

### CA-2: Sugerencias de a muchos
- **Dado** la lista de Productos del panel
- **Cuando** alguien del personal tilda varios productos (o elige todos los del filtro)
  y toca **Sugerir con IA**
- **Entonces** ve cuántos se van a pedir y un **costo estimado en dólares** antes de
  confirmar ("Vas a pedir 120 sugerencias. Costo estimado: US$ 12.").
- Y por defecto se piden solo los que **no tienen descripción o no tienen foto**; se
  puede tildar "Incluir los que ya tienen" para pedir igual.
- Y no se piden de nuevo los que ya tienen una sugerencia esperando revisión.
- Y al confirmar ve "Listo. Las sugerencias van a ir llegando a Para revisar." Se
  procesan de a tandas, hasta 400 por día; si se piden más, siguen al día siguiente.
- Y el pedido es de hasta 1.000 productos por vez (se puede repetir).

### CA-3: Bandeja "Para revisar"
- **Dado** el panel
- **Cuando** alguien del personal entra a **Para revisar**
- **Entonces** ve las sugerencias listas, de a una, con el producto, la descripción y
  la foto **actuales** al lado de las **sugeridas**, y puede revisarlas (CA-5).
- Y ve cuántas siguen en camino ("Faltan 35, siguen buscándose.") y cuántas fallaron,
  con un botón para volver a pedirlas.
- Y en el menú del panel, **Para revisar** muestra cuántas hay esperando.

### CA-4: Qué propone la IA
- **Dado** un producto con nombre, bodega, varietal y tipo
- **Cuando** la IA arma la sugerencia
- **Entonces** la **descripción** está en español, tiene de 2 a 3 oraciones (unas 40 a
  60 palabras), habla de la zona, la crianza, las notas y con qué acompañarlo, en tono
  elegante y sin exagerar, y **no** menciona precios, puntajes ni premios.
- Y la **foto** es de la botella o la etiqueta de **ese** producto, buscada primero en el
  sitio oficial de la bodega, después en el del importador o distribuidor; nunca en
  sitios de reventa o con marcas de agua.
- Y cada sugerencia muestra **de dónde salió** (los sitios consultados y el sitio de la
  foto), para poder chequearla.
- Y si no encuentra información confiable o una foto que sea de ese producto, lo dice
  ("No encontré una foto oficial.") en vez de inventar; puede sugerir solo una de las
  dos cosas.

### CA-5: Revisar y aprobar
- **Dado** una sugerencia lista
- **Cuando** alguien del personal la revisa
- **Entonces** puede **corregir el texto**, elegir qué usar (**descripción**, **foto** o
  las dos) y tocar **Aprobar**, o tocar **Descartar**.
- Y al aprobar, lo elegido reemplaza la descripción o la foto del producto y se ve en la
  carta enseguida; lo que no eligió queda como estaba.
- Y al descartar, el producto queda como estaba y se puede pedir otra sugerencia.
- Y queda registrado quién la aprobó o la descartó y cuándo.

### CA-6: Nada sin aprobar llega a la carta
- **Dado** una sugerencia que todavía no se aprobó (en camino, lista, fallida o
  descartada)
- **Cuando** un cliente mira la carta
- **Entonces** no ve ni la descripción ni la foto sugeridas; las fotos sugeridas no
  tienen una dirección pública.

### CA-7: Costo a la vista
- **Dado** la bandeja **Para revisar**
- **Cuando** alguien del personal la mira
- **Entonces** ve cuánto se gastó en sugerencias en el mes (en dólares, estimado según
  el uso registrado).

## Fuera de alcance
- Sugerir otros datos (nombre, bodega, varietal, precios, secciones, códigos).
- Aprobación automática o en bloque sin mirar cada sugerencia.
- Pedidos programados (por ejemplo, sugerir sola cada vez que se importa de Tango).
- Traducciones de las descripciones.

## Preguntas abiertas
- [x] ¿Qué modelo usamos? **Gemini 3.8 Flash** (decidido el 2026-11-02, ver `design.md`).
- [ ] Derechos de las fotos: se priorizan las oficiales (bodega o distribuidor) y se
  guarda el sitio de origen, pero el permiso de uso lo decide Lehonor.

## Ideas para más adelante
- Sugerir automáticamente para los productos nuevos de cada importación de Tango.
- Aprobar varias seguidas con atajos de teclado.
- Opción "usar solo las búsquedas gratis del mes" para que la carta se complete sin
  costo de búsquedas, más despacio.
