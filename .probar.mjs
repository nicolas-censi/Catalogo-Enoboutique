import { GoogleGenAI } from "@google/genai";
const ia = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
for (const [nombre, config] of [["sin herramientas", {}], ["con Google Search", { tools: [{ googleSearch: {} }] }]]) {
  for (const model of ["gemini-3.8-flash", "gemini-3.5-flash-lite"]) {
    try {
      const r = await ia.models.generateContent({ model, contents: "Decí hola", config });
      console.log(model, nombre, "OK:", (r.text ?? "").slice(0, 30));
    } catch (e) { console.log(model, nombre, "ERROR", e.status, String(e.message).slice(0, 160)); }
  }
}
