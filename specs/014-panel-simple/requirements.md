# 014 – Panel más simple

**Estado:** Borrador

## Objetivo
Que el panel sea sobrio, ordenado y fácil de usar para el personal, en la computadora y
en el celular: lo de todos los días a mano, lo de vez en cuando agrupado, una acción
principal clara por pantalla y menos ruido visual. No agrega funciones: todo lo que hoy
se puede hacer se sigue pudiendo hacer. La carta pública no cambia.

Maqueta de referencia: "Panel sobrio" (Productos, ficha por pestañas y celular eligiendo
varios), aprobada con esta spec.

## Historias de usuario
- Como **vendedor**, quiero **encontrar un producto y cambiarle algo en pocos toques**,
  también desde el celular.
- Como **encargado**, quiero **que lo que uso poco (importar, marca, IA, personal) no me
  estorbe**, pero tenerlo a un toque.
- Como **personal**, quiero **saber cuál es el botón importante de cada pantalla**.

## Criterios de aceptación
### CA-1: Menú
- **Dado** el panel en la computadora
- **Cuando** alguien del personal entra
- **Entonces** ve un menú lateral con **Productos**, **Secciones** y **Para revisar**
  (con la cantidad pendiente), y abajo **Ver la carta** y su usuario con **Salir**.
- Y el encargado ve además **Ajustes**, que reúne Importar desde Tango, Promociones,
  Marca, IA y Personal (cada uno con una línea que explica para qué sirve).
- Y en el celular el menú es una barra fija abajo con esas mismas opciones (íconos con
  texto); el usuario, Ver la carta y Salir quedan en **Ajustes** (o en un menú de cuenta
  para el vendedor).
- Y la opción en la que está se ve marcada.

### CA-2: Estilo sobrio y claro
- **Dado** cualquier pantalla del panel (también el ingreso)
- **Cuando** se ve
- **Entonces** usa los colores de la carta invertidos: fondo crema claro, texto casi
  negro, tarjetas blancas con líneas finas; el dorado solo como detalle (lo seleccionado,
  avisos). Mismas tipografías de la marca.
- Y el contraste de textos y controles cumple WCAG AA.
- Y la carta pública se sigue viendo igual (negra y dorada).

### CA-3: Un botón principal por pantalla
- **Dado** cualquier pantalla del panel
- **Cuando** se ve
- **Entonces** hay como máximo un botón principal (relleno); el resto son secundarios
  (con borde) o de texto.
- Y las acciones que borran o dan de baja van en un menú **⋯** de cada fila o de la
  ficha, y siempre piden confirmación.

### CA-4: Lista de productos
- **Dado** la pantalla **Productos**
- **Cuando** alguien del personal la usa
- **Entonces** arriba ve el buscador (busca al escribir y con Enter, sin botón Filtrar) y
  debajo filtros de un toque: Todos, Sin sección, Sin foto, A revisar, Ocultos, Sin stock
  y Sección.
- Y cada producto ocupa una fila compacta: foto chica, nombre, "Bodega · Sección · N
  añadas", el precio ("Desde $ …" si tiene varias añadas) y solo los estados que piden
  atención (Sin foto, A revisar, Oculto, Sugerencia para revisar) en texto suave.
- Y en el celular cada fila mide como mucho dos renglones (sin etiquetas "Bodega:",
  "Sección:").

### CA-5: Elegir varios
- **Dado** la lista de productos
- **Cuando** toca **Elegir varios**
- **Entonces** aparecen las casillas y, al tildar alguno, una barra fija abajo con la
  cantidad elegida y las acciones **Mover** y **Sugerir con IA** (si la IA está
  prendida), además de **Elegir los N del filtro**.
- Y con **Listo** se sale del modo y se vacía la selección.
- Y fuera de ese modo no se ven casillas ni la barra.

### CA-6: Ficha por pestañas
- **Dado** la ficha de un producto
- **Cuando** se abre
- **Entonces** arriba ve la foto, el nombre, "Bodega · Sección", el interruptor
  **Visible en la carta** y un menú **⋯** (Borrar producto).
- Y si hay una sugerencia de la IA, un aviso "La IA sugirió …" con **Revisar**, que
  muestra la revisión (spec 007) sin salir de la ficha.
- Y debajo, pestañas: **Datos** (tipo, nombre, bodega, varietal, sección, foto y
  descripción, con **Guardar cambios**), **Añadas y precios** (con la cantidad) y
  **Códigos de barras** (con la cantidad).
- Y la pestaña elegida queda en la dirección, así al volver atrás o recargar sigue en la
  misma.

### CA-7: Listas con menú de acciones
- **Dado** Secciones, una sección (subsecciones y destacados), Personal y Promociones
- **Cuando** se ven
- **Entonces** cada fila muestra lo importante y, como mucho, un interruptor (Visible /
  En la carta); Renombrar, Cambiar contraseña, Borrar o Dar de baja van en el menú **⋯**.
- Y crear algo nuevo (sección, persona, promoción) es el botón principal de la pantalla,
  que abre un formulario corto.

### CA-8: Nada se pierde
- **Dado** el panel nuevo
- **Cuando** se lo compara con el anterior
- **Entonces** todas las funciones siguen estando (las verifican los tests que ya
  existen, adaptados a la nueva ubicación de cada cosa).
- Y en el celular: sin scroll horizontal y todo lo tocable de al menos 44 px.

## Fuera de alcance
- Cambios en la carta pública.
- Funciones nuevas (por ejemplo, editar varios productos a la vez más allá de Mover).
- Modo oscuro del panel.

## Preguntas abiertas
- [ ] ¿El vendedor ve Promociones? Hoy es solo del encargado; queda igual salvo que digas
  lo contrario.

## Ideas para más adelante
- Atajos de teclado en la computadora (por ejemplo, "/" para buscar).
