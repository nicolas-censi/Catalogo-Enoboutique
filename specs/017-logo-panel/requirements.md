# 017 – Logo en el panel

**Estado:** En revisión

## Objetivo
Que el panel muestre el logo de la marca arriba del menú, donde hoy dice "Lehonor", igual
que la carta. Así el panel se reconoce como parte de la marca.

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

## Fuera de alcance
- Logo en la pantalla de ingreso o en la barra del celular.
- Cambiar el título de la pestaña del navegador.

## Preguntas abiertas
- [ ] ¿El logo lleva a algún lado al tocarlo? Propuesta: no, es solo la marca (para ir a
  la carta ya está "Ver la carta").

## Ideas para más adelante
