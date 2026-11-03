import { ApiError, type GenerateContentParameters, type GenerateContentResponse } from "@google/genai";
import { describe, expect, it } from "vitest";
import { costoUsd, preciosGemini } from "@/lib/ia/costo";
import { fuentesDe, SugeridorGemini, usoDe } from "@/lib/ia/gemini";
import { INSTRUCCIONES } from "@/lib/ia/pedido";
import type { ProductoParaSugerir } from "@/lib/ia/tipos";

// Spec 007, T3: llamada a Gemini (con un cliente falso: no gasta).
const producto: ProductoParaSugerir = { nombre: "Rutini Malbec", bodega: "Rutini Wines", varietal: "Malbec", tipo: "vino", anios: [2022] };
const valida = {
  descripcion: "Malbec del Valle de Uco con crianza en roble francés. Notas de ciruela y violetas; ideal con carnes asadas.",
  motivoSinDescripcion: null,
  paginaFoto: "https://www.rutini.com/malbec",
  fotoUrl: null,
  motivoSinFoto: null,
};

function respuesta(texto: string, extra: Partial<GenerateContentResponse> = {}) {
  return {
    text: texto,
    usageMetadata: { promptTokenCount: 1000, toolUsePromptTokenCount: 9000, candidatesTokenCount: 300, thoughtsTokenCount: 700 },
    candidates: [
      {
        groundingMetadata: {
          webSearchQueries: ["rutini malbec", "rutini malbec botella"],
          groundingChunks: [
            { web: { uri: "https://vertexaisearch.cloud.google.com/redirect/abc", title: "rutini.com" } },
            { web: { uri: "https://vertexaisearch.cloud.google.com/redirect/abc", title: "rutini.com" } },
          ],
        },
        urlContextMetadata: { urlMetadata: [{ retrievedUrl: "https://www.rutini.com/malbec", urlRetrievalStatus: "URL_RETRIEVAL_STATUS_SUCCESS" }] },
      },
    ],
    ...extra,
  } as unknown as GenerateContentResponse;
}

function clienteFalso(respuestas: (GenerateContentResponse | Error)[]) {
  const pedidos: GenerateContentParameters[] = [];
  return {
    pedidos,
    generateContent: async (p: GenerateContentParameters) => {
      pedidos.push(p);
      const r = respuestas.shift()!;
      if (r instanceof Error) throw r;
      return r;
    },
  };
}

describe("SugeridorGemini", () => {
  it("pide con el modelo elegido, las instrucciones, búsqueda en Google, lectura de páginas y JSON", async () => {
    const cliente = clienteFalso([respuesta(JSON.stringify(valida))]);
    const s = await new SugeridorGemini(cliente, "gemini-3.8-flash").sugerir(producto);
    const p = cliente.pedidos[0];
    expect(p.model).toBe("gemini-3.8-flash");
    expect(p.contents).toContain("Rutini Malbec");
    expect(p.config?.systemInstruction).toBe(INSTRUCCIONES);
    expect(p.config?.tools).toEqual([{ googleSearch: {} }, { urlContext: {} }]);
    expect(p.config?.responseMimeType).toBe("application/json");
    expect(s.descripcion).toBe(valida.descripcion);
    expect(s.paginaFoto).toBe(valida.paginaFoto);
  });

  it("las fuentes salen de la búsqueda y de las páginas leídas, sin repetir", async () => {
    const s = await new SugeridorGemini(clienteFalso([respuesta(JSON.stringify(valida))])).sugerir(producto);
    expect(s.fuentes).toEqual([
      { titulo: "www.rutini.com", url: "https://www.rutini.com/malbec" },
      { titulo: "rutini.com", url: "https://vertexaisearch.cloud.google.com/redirect/abc" },
    ]);
  });

  it("registra el uso: tokens de entrada (con herramientas), de salida (con razonamiento) y búsquedas", async () => {
    const s = await new SugeridorGemini(clienteFalso([respuesta(JSON.stringify(valida))])).sugerir(producto);
    expect(s.uso).toEqual({ tokensEntrada: 10000, tokensSalida: 1000, busquedas: 2 });
  });

  it("si la respuesta no sirve reintenta una vez (y suma el uso); si vuelve a fallar, error", async () => {
    const ok = await new SugeridorGemini(clienteFalso([respuesta("no es json"), respuesta(JSON.stringify(valida))])).sugerir(producto);
    expect(ok.uso.busquedas).toBe(4);
    const mal = new SugeridorGemini(clienteFalso([respuesta("no es json"), respuesta(JSON.stringify({ ...valida, descripcion: "Solo $ 47.000" }))]));
    await expect(mal.sugerir(producto)).rejects.toThrow(/no devolvió una sugerencia válida/);
  });

  it("si el modelo no acepta JSON estructurado con herramientas, pide el JSON en el texto", async () => {
    const cliente = clienteFalso([new ApiError({ message: "no", status: 400 }), respuesta(JSON.stringify(valida))]);
    await new SugeridorGemini(cliente).sugerir(producto);
    expect(cliente.pedidos[1].config?.responseMimeType).toBeUndefined();
  });

  it("los demás errores de la API se propagan", async () => {
    await expect(new SugeridorGemini(clienteFalso([new ApiError({ message: "cuota", status: 429 })])).sugerir(producto)).rejects.toThrow();
  });
});

describe("usoDe y fuentesDe", () => {
  it("toleran respuestas sin metadatos", () => {
    const vacia = { text: "" } as unknown as GenerateContentResponse;
    expect(usoDe(vacia)).toEqual({ tokensEntrada: 0, tokensSalida: 0, busquedas: 0 });
    expect(fuentesDe(vacia)).toEqual([]);
  });
});

describe("costoUsd (CA-7)", () => {
  it("usa los precios promocionales de 3.8 Flash en 2026 y los nuevos desde 2027", () => {
    const uso = { tokensEntrada: 15000, tokensSalida: 2000, busquedas: 3 };
    expect(costoUsd(uso, new Date("2026-11-02T12:00:00Z"))).toBeCloseTo(0.01125 + 0.0075 + 0.042, 5);
    expect(costoUsd(uso, new Date("2027-01-02T12:00:00Z"))).toBeCloseTo(0.0225 + 0.015 + 0.042, 5);
    expect(preciosGemini(new Date("2027-01-01T02:59:00Z")).entradaPorMillon).toBe(0.75);
  });
});

describe("estimarCosto (CA-2)", () => {
  it("usa el uso promedio registrado, descuenta las búsquedas gratis del mes y aplica el margen", async () => {
    const { estimarCosto, AJUSTE_REAL, BUSQUEDAS_GRATIS_MES } = await import("@/lib/ia/costo");
    const fecha = new Date("2026-11-03T12:00:00Z");
    const uso = { tokensEntrada: 15000, tokensSalida: 2000, busquedas: 3 };
    // 100 productos, búsquedas todas gratis: solo tokens.
    expect(estimarCosto({ cantidad: 100, promedio: uso, busquedasDelMes: 0, fecha })).toBeCloseTo(100 * (0.01125 + 0.0075) * AJUSTE_REAL, 4);
    // Sin búsquedas gratis restantes: se pagan las 300.
    expect(estimarCosto({ cantidad: 100, promedio: uso, busquedasDelMes: BUSQUEDAS_GRATIS_MES, fecha })).toBeCloseTo(100 * (0.01125 + 0.0075 + 0.042) * AJUSTE_REAL, 4);
    // Sin datos todavía: el uso típico.
    expect(estimarCosto({ cantidad: 10, promedio: null, busquedasDelMes: BUSQUEDAS_GRATIS_MES, fecha })).toBeGreaterThan(0);
  });
});
