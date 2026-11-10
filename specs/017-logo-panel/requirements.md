# 017 – Logo en el panel y tamaño automático

**Estado:** Aprobada (2026-11-10)

## Objetivo
Que el panel muestre el logo de la marca arriba del menú, donde hoy dice "Lehonor", igual
que la carta. Y que cualquier logo que suba el encargado se vea del tamaño correcto,
aunque el archivo traiga margen vacío alrededor (hoy el logo nuevo, de 1920×1080 con el
dibujo en 1900×556, se ve a la mitad de alto).

## Historias de usuario
- Como **personal**, quiero **ver el logo de la marca en el panel**.
- Como **encargado**, quiero que **al cambiar el logo en Marca cambie también en el panel**.

## Criterios de aceptación
### CA-1: Logo arriba del menú
- **Dado** el panel en la computadora
- **Cuando** alguien del personal entra
- **Entonces** arriba del menú lateral, en lugar del texto "Lehonor", se ve el logo (el
  que subió el encargado en Marca, o el original si no subió ninguno), de unos 40 px de
  alto, con el nombre "Lehonor Enoboutique" como texto alternativo.
- Y en el celular no cambia nada: la barra de abajo sigue sin logo (no hay lugar).

### CA-2: Sigue al logo de Marca
- **Dado** que el encargado sube un logo nuevo en Ajustes → Marca
- **Cuando** vuelve a cargar cualquier pantalla del panel
- **Entonces** el menú muestra el logo nuevo.

### CA-3: El logo ocupa su lugar aunque el archivo traiga margen
- **Dado** un logo con margen transparente (o de un color liso) alrededor del dibujo
- **Cuando** el encargado lo sube en Ajustes → Marca
- **Entonces** se guarda recortado al dibujo (con un margen mínimo de 1 % para no cortar
  bordes suaves), y en la carta, la tarjeta QR y el panel el dibujo ocupa todo el alto
  previsto.
- Y si el archivo no tiene margen, queda igual.
- Y si el dibujo es muy ancho, no se sale de la pantalla en el celular (ancho máximo).

## Fuera de alcance
- Logo en la pantalla de ingreso o en la barra del celular.
- Cambiar el título de la pestaña del navegador.

## Preguntas abiertas
- [ ] ¿El logo lleva a algún lado al tocarlo? Propuesta: no, es solo la marca (para ir a
  la carta ya está "Ver la carta").

## Ideas para más adelante
