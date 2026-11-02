# 006 – Marca y textos editables

**Estado:** Borrador

## Objetivo
Que el encargado pueda cambiar desde el panel la bienvenida de la carta, el logo y los
colores, sin pedir un cambio de desarrollo, cuidando que la carta siga siendo legible.

## Historias de usuario
- Como **encargado**, quiero **escribir una bienvenida** que se vea en el inicio de la
  carta.
- Como **encargado**, quiero **cambiar el logo** y **los colores** de la carta.

## Criterios de aceptación
### CA-1: Bienvenida
- **Dado** el encargado en **Marca** (panel)
- **Cuando** escribe una bienvenida (hasta 200 caracteres) y guarda
- **Entonces** el inicio de la carta la muestra debajo del logo, al instante.
- Y si la deja vacía, no se muestra nada.

### CA-2: Logo
- **Dado** el encargado en **Marca**
- **Cuando** sube un logo nuevo (PNG, SVG o WebP, hasta 2 MB; conviene con fondo
  transparente)
- **Entonces** la carta lo muestra en el encabezado de todas sus páginas, al instante,
  con el mismo texto alternativo ("Lehonor Enoboutique").
- Y se ve una vista previa sobre el color de fondo antes de guardar.
- Y puede volver al logo original con **Volver al logo de la marca**.

### CA-3: Colores
- **Dado** el encargado en **Marca**
- **Cuando** cambia los colores con un selector
- **Entonces** puede elegir cuatro colores:
  - **Fondo** de la página;
  - **Tarjetas** (productos y buscador);
  - **Principal** (logo, títulos, nombres de vinos, precios, botones; hoy el dorado);
  - **Texto** (bodega, varietal, años, ayudas; hoy el crema).
- Y ve una vista previa de una tarjeta de producto con esos colores antes de guardar.
- Y al guardar, la carta (y el panel) usan los colores nuevos, al instante.

### CA-4: Siempre legible
- **Dado** una combinación de colores
- **Cuando** el contraste entre el texto o el color principal y el fondo o las
  tarjetas es menor a 4,5:1 (lo mínimo que piden las pautas de accesibilidad WCAG AA)
- **Entonces** no se puede guardar y se explica cuál par no se lee bien ("El color
  principal sobre las tarjetas no se lee bien: contraste 2,1:1, hace falta 4,5:1").
- Y puede volver a los colores originales con **Volver a los colores de la marca**.

### CA-5: Solo el encargado
- **Dado** un vendedor
- **Cuando** intenta entrar a **Marca**
- **Entonces** no tiene acceso. La carta y la base solo dejan cambiar esto al encargado.

## Fuera de alcance
- Elegir tipografías.
- Otros textos de la carta (pie con datos del local, aviso de precios, mensajes).
- Colores distintos para el panel y para la carta.

## Preguntas abiertas
- [ ] ¿Los colores nuevos se aplican también al **panel**? Propuesta: sí (es la misma
  marca y así se ve el resultado); si alguna vez queda raro, se vuelve a los colores de
  la marca con un botón.

## Decisiones tomadas en la revisión
- **Textos editables:** la bienvenida del inicio.
- **Marca:** logo y colores editables, con control de contraste.
- **Quién:** solo el encargado.

## Ideas para más adelante
- Pie con datos del local (dirección, horario, WhatsApp, Instagram) y aviso de precios.
- Elegir entre tipografías de la marca.
