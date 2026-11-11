# 018 – Ícono de la web

**Estado:** Implementada (2026-11-11)

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
- **Entonces** se ve el isotipo de Lehonor (el rostro con hojas y uvas, en dorado) sobre
  un círculo casi negro (#1B1A17), y no el triángulo de Vercel. El círculo hace que el
  dorado se lea en pestañas claras y oscuras (elegido el 2026-11-11).
- Y hay versiones de 16, 32 y 48 px (pestaña, esquinas transparentes), 180 px (iPhone,
  "Agregar a inicio": el círculo sobre crema, porque iOS no admite transparencia) y
  512 px (Android).

## Fuera de alcance
- Cambiar el ícono desde el panel (por ahora es un archivo fijo de la marca).

## Preguntas abiertas
- [x] ¿Sirve la "L" del logo, o la marca tiene un isotipo propio? → Isotipo propio, lo
  pasó el usuario el 2026-11-11 (`assets/marca/isotipo.png`).

## Ideas para más adelante
- Que el encargado pueda subir el ícono desde Ajustes → Marca.
