import "server-only";
import { updateTag } from "next/cache";
import { ETIQUETA_CARTA } from "@/lib/carta-cache";

/**
 * Hace que la carta pública muestre ya lo que se acaba de guardar (spec 004, CA-11).
 * Solo se puede llamar desde Server Actions.
 */
export function invalidarCarta() {
  updateTag(ETIQUETA_CARTA);
}
