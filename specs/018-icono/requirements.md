# 018 – Ícono de la web

**Estado:** En revisión

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
- **Entonces** se ve la "L" del logo en casi negro (#1B1A17) sobre crema (#F6F2E9), la
  misma de la marca, y no el triángulo de Vercel.
- Y se ve nítido en 16 y 32 px (pestaña), 180 px (iPhone, "Agregar a inicio") y 512 px
  (Android).

## Fuera de alcance
- Cambiar el ícono desde el panel (por ahora es un archivo fijo de la marca).

## Preguntas abiertas
- [ ] ¿Sirve la "L" del logo, o la marca tiene un isotipo propio para usar?

## Ideas para más adelante
- Que el encargado pueda subir el ícono desde Ajustes → Marca.
