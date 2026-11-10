# 016 – Carta en colores claros

**Estado:** Aprobada (2026-11-10)

## Objetivo
Que la carta pública tenga los mismos colores que el panel: fondo crema, letras casi
negras y el dorado solo en detalles. Así la marca se ve igual en todos lados y la carta
queda más sobria y luminosa. Cambian solo los colores: las pantallas, el orden y las
tipografías siguen igual.

## Historias de usuario
- Como **cliente**, quiero **leer la carta con fondo claro y letras oscuras**, para leerla
  cómoda en el local.
- Como **encargado**, quiero **subir el logo nuevo (del color de las letras)** desde
  Ajustes → Marca y ver en la vista previa cómo queda sobre la carta.

## Criterios de aceptación
### CA-1: Colores de la carta
- **Dado** cualquier pantalla de la carta (inicio, sección, vino, búsqueda, escanear)
- **Cuando** el cliente la abre
- **Entonces** el fondo es crema (#F6F2E9), las tarjetas o campos blancos, los nombres
  de vinos, secciones, títulos y precios en casi negro (#1B1A17) y el texto secundario
  (bodega · varietal, años, ayudas) en gris cálido (#5E584C), los mismos colores del
  panel.
- Y todo el texto cumple contraste AA (4,5:1; 3:1 los íconos y bordes de controles).

### CA-2: El dorado, solo en detalles
- **Dado** la carta
- **Cuando** se ve
- **Entonces** el dorado del logo (#B19750) aparece solo en adornos: la línea corta bajo
  los títulos, las líneas finas entre vinos y subsecciones, la línea del buscador y los
  indicadores del carrusel de promociones.
- Y ningún texto, ícono ni botón queda en ese dorado (sobre crema no se lee: 2,5:1); los
  íconos (buscar, escanear, flechas) y los botones van en casi negro.

### CA-3: Logo y vista previa
- **Dado** el encargado en Ajustes → Marca
- **Cuando** sube el logo nuevo
- **Entonces** la vista previa lo muestra sobre el fondo crema de la carta.
- Y la carta lo muestra igual que hoy (mismo tamaño y lugar).

### CA-4: Tarjeta QR
- **Dado** la tarjeta QR para imprimir (Ajustes → Tarjeta QR)
- **Cuando** el encargado la abre o la imprime
- **Entonces** tiene los mismos colores que la carta: fondo crema, texto y QR en casi
  negro, con el detalle dorado.

## Fuera de alcance
- Cambiar tipografías, tamaños, el orden de las pantallas o el texto.
- Hacer el logo nuevo: lo sube el encargado desde el panel.
- Un modo oscuro opcional.

## Preguntas abiertas
- [x] ¿El logo nuevo lo sube el encargado o lo carga Claude? → Lo sube el encargado desde
  Ajustes → Marca (no hace falta pasarlo por el chat).

## Ideas para más adelante
