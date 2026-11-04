// Spec 007, T3: sugerencias con Gemini (búsqueda en Google + lectura de páginas).
// Se usa solo en el servidor (desde sugeridor.ts). Recibe el cliente para poder probarlo.
import { ApiError, type GenerateContentConfig, type GenerateContentResponse, type GoogleGenAI } from "@google/genai";
import { esquemaJsonRespuesta, leerRespuesta } from "./esquema";
import { armarPedido, INSTRUCCIONES } from "./pedido";
import type { Fuente, ProductoParaSugerir, SugerenciaIA, Sugeridor, UsoIA } from "./tipos";

export const MODELO_POR_DEFECTO = "gemini-3.8-flash";
const ESPERA_MS = 120_000;

type Modelos = Pick<GoogleGenAI["models"], "generateContent">;

export class ErrorIA extends Error {}

function configuracion(conEsquema: boolean): GenerateContentConfig {
  return {
    systemInstruction: INSTRUCCIONES,
    tools: [{ googleSearch: {} }, { urlContext: {} }],
    ...(conEsquema ? { responseMimeType: "application/json", responseJsonSchema: esquemaJsonRespuesta() } : {}),
    abortSignal: AbortSignal.timeout(ESPERA_MS),
  };
}

/** Tokens y búsquedas de una respuesta (se suman si hubo reintento). */
export function usoDe(respuesta: GenerateContentResponse): UsoIA {
  const u = respuesta.usageMetadata ?? {};
  const busquedas = respuesta.candidates?.[0]?.groundingMetadata?.webSearchQueries?.length ?? 0;
  return {
    tokensEntrada: (u.promptTokenCount ?? 0) + (u.toolUsePromptTokenCount ?? 0),
    tokensSalida: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0),
    busquedas,
  };
}

/** Fuentes según la búsqueda y las páginas leídas, no según lo que escribió el modelo. */
export function fuentesDe(respuesta: GenerateContentResponse): Fuente[] {
  const candidato = respuesta.candidates?.[0];
  const fuentes: Fuente[] = [];
  for (const u of candidato?.urlContextMetadata?.urlMetadata ?? []) {
    if (u.retrievedUrl && String(u.urlRetrievalStatus ?? "").endsWith("SUCCESS")) {
      fuentes.push({ titulo: new URL(u.retrievedUrl).hostname, url: u.retrievedUrl });
    }
  }
  for (const c of candidato?.groundingMetadata?.groundingChunks ?? []) {
    if (c.web?.uri) fuentes.push({ titulo: c.web.title || new URL(c.web.uri).hostname, url: c.web.uri });
  }
  const vistas = new Set<string>();
  return fuentes.filter((f) => f.url.startsWith("https://") && !vistas.has(f.url) && vistas.add(f.url)).slice(0, 8);
}

const sumar = (a: UsoIA, b: UsoIA): UsoIA => ({
  tokensEntrada: a.tokensEntrada + b.tokensEntrada,
  tokensSalida: a.tokensSalida + b.tokensSalida,
  busquedas: a.busquedas + b.busquedas,
});

export class SugeridorGemini implements Sugeridor {
  // Si el modelo no acepta salida estructurada junto con las herramientas, se pide el
  // JSON en el texto (las instrucciones ya lo piden) y se valida igual.
  private conEsquema = true;

  constructor(
    private readonly modelos: Modelos,
    private readonly modelo = MODELO_POR_DEFECTO,
  ) {}

  private async llamar(contenido: string): Promise<GenerateContentResponse> {
    try {
      return await this.modelos.generateContent({ model: this.modelo, contents: contenido, config: configuracion(this.conEsquema) });
    } catch (error) {
      if (this.conEsquema && error instanceof ApiError && error.status === 400) {
        this.conEsquema = false;
        return this.modelos.generateContent({ model: this.modelo, contents: contenido, config: configuracion(false) });
      }
      throw error;
    }
  }

  async sugerir(producto: ProductoParaSugerir): Promise<SugerenciaIA> {
    const pedido = armarPedido(producto);
    let uso: UsoIA = { tokensEntrada: 0, tokensSalida: 0, busquedas: 0 };
    let ultimoError = "";
    // Un reintento si la respuesta no cumple el formato o las reglas.
    for (let intento = 0; intento < 2; intento++) {
      const respuesta = await this.llamar(
        intento === 0 ? pedido : `${pedido}\n\nTu respuesta anterior no sirvió (${ultimoError}). Respondé de nuevo cumpliendo las reglas.`,
      );
      uso = sumar(uso, usoDe(respuesta));
      const lectura = leerRespuesta(respuesta.text ?? "");
      if (lectura.ok) return { ...lectura.datos, fuentes: fuentesDe(respuesta), uso };
      ultimoError = lectura.error;
    }
    throw Object.assign(new ErrorIA(`La IA no devolvió una sugerencia válida: ${ultimoError}`), { uso });
  }
}
