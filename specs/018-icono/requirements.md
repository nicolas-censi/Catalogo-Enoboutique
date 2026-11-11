# 018 – Ícono de la web

**Estado:** Aprobada (2026-11-11)

## Objetivo
Que la pestaña del navegador, los favoritos y el acceso directo del celular muestren el
ícono de Lehonor y no el de Next.js/Vercel (el que vino con el proyecto base).

## Historias de usuario
- Como **cliente**, quiero **reconocer la carta de Lehonor en la pestaña** y si la guardo
  en la pantalla de inicio del celular.

## Criterios de aceptación
### CA-1: Ícono de la marca
- **Dado** la carta o el panel abiertos en el navegador
- **Cuando** se mira la pestaña
- **Entonces** se ve el isotipo de Lehonor (el rostro con hojas y uvas, en dorado) y no
  el triángulo de Vercel.
- Y hay versiones de 16, 32 y 48 px (pestaña, fondo transparente), 180 px (iPhone,
  "Agregar a inicio", sobre crema porque iOS no admite transparencia) y 512 px (Android).

## Fuera de alcance
- Cambiar el ícono desde el panel (por ahora es un archivo fijo de la marca).

## Preguntas abiertas
- [x] ¿Sirve la "L" del logo, o la marca tiene un isotipo propio? → Isotipo propio, lo
  pasó el usuario el 2026-11-11 (`assets/marca/isotipo.png`).

## Ideas para más adelante
- Que el encargado pueda subir el ícono desde Ajustes → Marca.
