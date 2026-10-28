# 011 – Subsecciones

**Estado:** Aprobada (2026-10-28)

## Objetivo
Que una sección de la carta se pueda dividir en subsecciones (por ejemplo, Cava en
Joyitas, Añadas y Experiencias), para que el cliente encuentre más rápido lo que busca
y el personal arme la carta como está organizado el local.

## Historias de usuario
- Como **cliente**, quiero **ver una sección dividida en subsecciones**, con un título
  para cada una, para ubicar rápido el tipo de vino que busco.
- Como **encargado o vendedor**, quiero **crear, renombrar, ordenar, ocultar y borrar
  subsecciones** dentro de una sección, y **elegir la subsección de cada producto**.

## Criterios de aceptación
### CA-1: Crear subsecciones
- **Dado** el personal en la pantalla de una sección del panel (la de sus destacados,
  spec 005)
- **Cuando** crea una subsección con un nombre
- **Entonces** queda dentro de esa sección, al final de sus subsecciones.
- Y hay **un solo nivel**: una subsección no puede tener subsecciones.

### CA-2: Todo producto está en una subsección
- **Dado** una sección con subsecciones
- **Cuando** el personal da de alta o edita un producto de esa sección
- **Entonces** tiene que elegir una de sus subsecciones (el selector muestra
  "Cava › Joyitas"); no se puede guardar el producto en la sección sin subsección.
- Y si la sección ya tenía productos al crear su **primera** subsección, todos pasan a
  esa subsección (se avisa: "Los 12 productos de Cava pasaron a Joyitas. Después podés
  moverlos."), así ningún producto queda suelto.

### CA-3: La carta muestra las subsecciones en una sola página
- **Dado** una sección con subsecciones
- **Cuando** el cliente la abre
- **Entonces** ve, en una sola página, el título de cada subsección con sus productos
  debajo, en el orden que eligió el personal.
- Y arriba hay accesos para saltar a cada subsección (funcionan sin JavaScript).
- Y no aparecen las subsecciones ocultas ni las que no tienen productos disponibles.
- Y en el inicio de la carta solo aparecen las secciones, no las subsecciones.
- Y una sección sin subsecciones se sigue viendo igual que ahora.

### CA-4: Orden dentro de cada subsección
- **Dado** una subsección
- **Cuando** se muestra en la carta
- **Entonces** sus productos siguen las reglas de la spec 005: primero sus destacados,
  en el orden que eligió el personal, y después el resto por bodega y del más caro al
  más barato.
- Y el personal elige los destacados de cada subsección desde su pantalla en el panel,
  igual que en una sección.

### CA-5: Administrar subsecciones
- **Dado** el personal en la pantalla de una sección
- **Cuando** administra sus subsecciones
- **Entonces** puede renombrarlas, ordenarlas arrastrando (spec 005, CA-1 y CA-4),
  ocultarlas y mostrarlas, y entrar a los destacados de cada una.
- Y una subsección con productos no se puede borrar: se ofrece ocultarla.
- Y ocultar la sección oculta también todas sus subsecciones.

### CA-6: Panel de productos
- **Dado** la lista de productos del panel
- **Cuando** se filtra por una sección
- **Entonces** aparecen también los productos de sus subsecciones, y se puede filtrar
  por una subsección en particular.
- Y la lista muestra la sección y la subsección de cada producto ("Cava › Joyitas").

## Fuera de alcance
- Más de un nivel (subsecciones dentro de subsecciones).
- Pasar una subsección de una sección a otra.
- Productos sueltos en una sección que tiene subsecciones.
- Que la importación de Tango (spec 8) asigne subsecciones: se define en esa spec.

## Decisiones tomadas en la revisión
- **En la carta:** todo en una página, con títulos y accesos a cada subsección.
- **Productos sueltos:** no; en una sección con subsecciones, todo producto está en una.
- **Orden:** igual que las secciones (destacados + bodega y precio; subsecciones
  arrastrables).
- **Niveles:** uno solo.
- **Primera subsección:** si la sección ya tiene productos, pasan todos a esa
  subsección, con aviso, y después se reparten.

## Ideas para más adelante
- Mover varios productos a otra subsección de una vez desde la lista del panel.
