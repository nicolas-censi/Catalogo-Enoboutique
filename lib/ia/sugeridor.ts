import "server-only";
// Spec 007: elige la IA según el entorno. Con IA_FALSA=1, la de prueba.
import { GoogleGenAI } from "@google/genai";
import { SugeridorFalso } from "./falso";
import { modeloIA } from "./costo";
import { SugeridorGemini } from "./gemini";
import type { Sugeridor } from "./tipos";

export function obtenerSugeridor(): Sugeridor {
  if (process.env.IA_FALSA === "1") return new SugeridorFalso();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Falta la variable de entorno GEMINI_API_KEY.");
  return new SugeridorGemini(new GoogleGenAI({ apiKey }).models, modeloIA());
}
