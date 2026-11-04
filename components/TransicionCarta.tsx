import { ViewTransition } from "react";
import type { ReactNode } from "react";

/**
 * Cambio de página suave en la carta (spec 013): fundido y leve desplazamiento, con el
 * estilo de globals.css. Solo en la carta: en el panel, cualquier actualización
 * animaría la página entera (y trabaría, por ejemplo, el arrastre).
 */
export function TransicionCarta({ children }: { children: ReactNode }) {
  return <ViewTransition>{children}</ViewTransition>;
}
