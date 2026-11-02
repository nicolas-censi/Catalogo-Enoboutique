# 006 – Marca y textos editables

**Estado:** Aprobada (2026-11-02)

## Objetivo
Que el encargado pueda cambiar desde el panel la bienvenida de la carta y el logo, sin
pedir un cambio de desarrollo.

## Historias de usuario
- Como **encargado**, quiero **escribir una bienvenida** que se vea en el inicio de la
  carta.
- Como **encargado**, quiero **cambiar el logo** de la carta, por si hace falta.

## Criterios de aceptación
### CA-1: Bienvenida
- **Dado** el encargado en **Marca** (panel)
- **Cuando** escribe una bienvenida (hasta 200 caracteres) y guarda
- **Entonces** el inicio de la carta la muestra debajo del logo, al instante.
- Y si la deja vacía, no se muestra nada.

### CA-2: Logo
- **Dado** el encargado en **Marca**
- **Cuando** sube un logo nuevo (PNG o WebP, hasta 2 MB; conviene con fondo
  transparente)
- **Entonces** la carta lo muestra en el encabezado de todas sus páginas, al instante,
  con el mismo texto alternativo ("Lehonor Enoboutique").
- Y se ve una vista previa sobre el color de fondo antes de guardar.
- Y puede volver al logo original con **Volver al logo de la marca**.

### CA-3: Solo el encargado
- **Dado** un vendedor
- **Cuando** intenta entrar a **Marca**
- **Entonces** no tiene acceso. La carta y la base solo dejan cambiar esto al encargado.

## Fuera de alcance
- Elegir colores o tipografías: quedan los de la marca (en el código).
- Otros textos de la carta (pie con datos del local, aviso de precios, mensajes).

## Decisiones tomadas en la revisión
- **Textos editables:** la bienvenida del inicio.
- **Marca:** solo el logo es editable; los colores no (se descartaron en la revisión).
- **Quién:** solo el encargado.
- **Formato del logo:** PNG o WebP. Se descartó SVG porque puede llevar código adentro.

## Ideas para más adelante
- Pie con datos del local (dirección, horario, WhatsApp, Instagram) y aviso de precios.
- Elegir entre tipografías de la marca.
- Colores editables con control de contraste (se habló y se descartó por ahora).
