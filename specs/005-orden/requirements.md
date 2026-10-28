# 005 – Orden de la carta

**Estado:** Aprobada (2026-10-28)

## Objetivo
Que el personal decida en qué orden aparecen las secciones de la carta y qué productos
se muestran primero en cada una, sin tener que ordenar a mano cientos de vinos: el
resto de cada sección se ordena solo, por bodega y por precio.

## Historias de usuario
- Como **encargado o vendedor**, quiero **arrastrar las secciones** para elegir en qué
  orden aparecen en la carta.
- Como **encargado o vendedor**, quiero **destacar algunos productos** de una sección y
  ordenarlos arrastrando, para que el cliente los vea primero.
- Como **cliente**, quiero **encontrar los vinos agrupados por bodega**, del más caro al
  más barato, para comparar rápido.

## Criterios de aceptación
### CA-1: Ordenar secciones arrastrando
- **Dado** el personal en la pantalla **Secciones** del panel
- **Cuando** arrastra una sección a otra posición
- **Entonces** el nuevo orden se guarda solo (sin botón "Guardar"), se avisa "Orden
  guardado" y la carta muestra las secciones en ese orden al instante.
- Y si no se pudo guardar, se avisa y la lista vuelve al orden anterior.

### CA-2: Orden automático dentro de cada sección
- **Dado** una sección de la carta
- **Cuando** el cliente la abre
- **Entonces** primero aparecen los destacados (CA-3) y después el resto, ordenado:
  1. por **bodega**, de la A a la Z (sin distinguir tildes ni mayúsculas);
  2. dentro de cada bodega, por **precio, del más caro al más barato**. Un vino con
     varias añadas se ordena por su añada disponible **más barata**;
  3. a igual precio, por nombre.
- Y los productos sin bodega (por ejemplo, almacén) van después de los que tienen
  bodega, también del más caro al más barato.
- Y un producto nuevo, editado o importado de Tango cae solo en su lugar.

### CA-3: Destacados
- **Dado** el personal en la pantalla de una sección del panel
- **Cuando** agrega un producto de esa sección a **Destacados**, los arrastra para
  ordenarlos o quita alguno
- **Entonces** el cambio se guarda solo y la carta muestra los destacados arriba de
  todo, en ese orden, al instante. Un producto que deja de ser destacado vuelve a su
  lugar automático.
- Y si un producto destacado se pasa a otra sección, deja de ser destacado (no
  aparece "destacado" en una sección que no eligió el personal).
- Y un destacado oculto o sin stock no se ve en la carta, pero conserva su lugar para
  cuando vuelva.

### CA-4: Accesible y usable en el celular
- **Dado** las listas que se ordenan arrastrando (secciones y destacados)
- **Cuando** se usan con teclado, con lector de pantalla o en el celular
- **Entonces** se pueden mover con el teclado (Espacio para tomar, flechas para mover,
  Espacio para soltar), cada movimiento se anuncia ("Tintos, posición 2 de 6"), en el
  celular se arrastra desde una manija de 44×44 px sin trabar el scroll, y axe no
  reporta errores graves.

## Fuera de alcance
- Ordenar a mano todos los productos de una sección (el resto se ordena solo).
- Otros criterios de orden automático o elegir el criterio por sección.
- Un distintivo visual de "destacado" en la carta (los destacados solo van primero).
- Ordenar las añadas: siguen de la más nueva a la más vieja (spec 1).
- El orden de los resultados de búsqueda: siguen por relevancia (spec 2).

## Decisiones tomadas en la revisión
- **Productos:** destacados ordenados a mano arriba; el resto por bodega (A-Z) y,
  dentro de cada bodega, del más caro al más barato.
- **Secciones:** se ordenan arrastrando desde la pantalla Secciones.
- **Destacados:** sin máximo por sección.

## Ideas para más adelante
- Mostrar un distintivo "Recomendado" en los destacados de la carta.
- Destacar desde la ficha del producto o desde la lista de productos del panel.
