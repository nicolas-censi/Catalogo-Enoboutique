# 015 – Panel más ágil

**Estado:** Borrador

## Objetivo
Que moverse por el panel sea rápido y sin saltos, y que pedir una sugerencia a la IA no
deje trabado al personal: la IA trabaja en segundo plano y avisa cuando hay algo para
revisar.

## Historias de usuario
- Como **personal**, quiero **pasar de una pantalla a otra sin pantallazos negros y
  viendo que está cargando**, para saber que el panel me respondió.
- Como **personal**, quiero **pedir una sugerencia y seguir trabajando**, y que el panel
  **me avise** cuando esté lista y me muestre cuántas tengo para revisar.

## Criterios de aceptación
### CA-1: Sin pantallazo negro
- **Dado** el panel
- **Cuando** se pasa de una pantalla a otra (o se entra al panel)
- **Entonces** el fondo es siempre el del panel (crema), nunca negro.
- Y el menú queda fijo en su lugar: solo cambia el contenido.

### CA-2: Cargando
- **Dado** un cambio de pantalla que tarda
- **Cuando** el contenido todavía no llegó
- **Entonces** en su lugar se ve un indicador animado con "Cargando…" (con "reducir
  movimiento", sin animación).
- Y el menú responde al toque enseguida (la opción elegida se marca en el momento).

### CA-3: Sugerencias en segundo plano
- **Dado** la ficha de un producto
- **Cuando** alguien del personal toca **Sugerir con IA**
- **Entonces** el pedido queda hecho al instante: la ficha dice "La IA está buscando…
  Te avisamos cuando esté lista. Podés seguir trabajando." y se puede ir a cualquier
  otra pantalla y hacer cualquier otra cosa mientras tanto.
- Y lo mismo con los pedidos de a muchos: la cola avanza mientras el panel esté abierto
  en cualquier pantalla (no solo en **Para revisar**).

### CA-4: Aviso y contador
- **Dado** una sugerencia que se terminó de buscar
- **Cuando** alguien del personal está en cualquier pantalla del panel
- **Entonces** ve un aviso "Llegó una sugerencia para *Producto*" con **Revisar** (o
  "Llegaron N sugerencias para revisar" si son varias), que desaparece solo o al cerrarlo.
- Y el contador de **Para revisar** del menú se actualiza solo, sin recargar.
- Y si falló, el aviso lo dice ("No se pudo buscar la sugerencia de *Producto*").

### CA-5: Nada se rompe
- **Dado** el panel con estos cambios
- **Cuando** se usa como hasta ahora
- **Entonces** todo lo demás funciona igual (los tests existentes siguen pasando), con
  la IA apagada no se pide nada y no hay gasto, y se mantiene la accesibilidad (avisos
  anunciados a lectores de pantalla, 44 px, sin scroll horizontal).

## Fuera de alcance
- Notificaciones del navegador o del celular (fuera del panel abierto).
- Avisos por mail.

## Ideas para más adelante
- Notificaciones del celular cuando haya muchas sugerencias listas.
