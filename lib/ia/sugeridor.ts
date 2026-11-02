import "server-only";
// Spec 007: elige la IA según el entorno. Con IA_FALSA=1, la de prueba.
import { SugeridorFalso } from "./falso";
import type { Sugeridor } from "./tipos";

export function obtenerSugeridor(): Sugeridor {
  if (process.env.IA_FALSA === "1") return new SugeridorFalso();
  // La implementación con Gemini llega en T3.
  throw new Error("La IA todavía no está configurada.");
}
