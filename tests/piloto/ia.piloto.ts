// Spec 007, T3: compara modelos de Gemini con productos reales y deja un informe en
// piloto-ia/ (no se sube al repositorio). Uso:
//   IA_PILOTO_MODELOS=gemini-3.8-flash,gemini-3.1-pro-preview IA_PILOTO_CANTIDAD=20 npm run ia:piloto
import { mkdirSync, writeFileSync } from "node:fs";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { it } from "vitest";
import { costoUsd } from "@/lib/ia/costo";
import { SugeridorGemini } from "@/lib/ia/gemini";
import type { ProductoParaSugerir, SugerenciaIA } from "@/lib/ia/tipos";

const modelos = (process.env.IA_PILOTO_MODELOS || "gemini-3.8-flash,gemini-3.1-pro-preview").split(",").map((m) => m.trim());
const cantidad = Number(process.env.IA_PILOTO_CANTIDAD || 20);

type Fila = { id: string; nombre: string; tipo: ProductoParaSugerir["tipo"]; varietal: string | null; bodegas: { nombre: string } | null; anadas: { anio: number | null }[] };

async function muestra(): Promise<ProductoParaSugerir[]> {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data, error } = await db
    .from("productos")
    .select("id, nombre, tipo, varietal, bodegas(nombre), anadas!inner(anio)")
    .eq("visible", true)
    .eq("anadas.en_stock", true)
    .order("id")
    .limit(600);
  if (error) throw error;
  const filas = data as unknown as Fila[];
  // Variedad: 80 % vinos de bodegas distintas, el resto de otros tipos.
  const vinos: Fila[] = [];
  const bodegas = new Set<string>();
  for (const f of filas) {
    if (f.tipo === "vino" && f.bodegas && !bodegas.has(f.bodegas.nombre)) {
      bodegas.add(f.bodegas.nombre);
      vinos.push(f);
    }
  }
  const otros = filas.filter((f) => f.tipo !== "vino");
  const elegidos = [...vinos.slice(0, Math.ceil(cantidad * 0.8)), ...otros.slice(0, cantidad)].slice(0, cantidad);
  return elegidos.map((f) => ({ nombre: f.nombre, tipo: f.tipo, varietal: f.varietal, bodega: f.bodegas?.nombre ?? null, anios: f.anadas.map((a) => a.anio) }));
}

const celda = (t: string | null | undefined) => (t ?? "—").replace(/\|/g, "/").replace(/\n/g, " ");

it("piloto de sugerencias", async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Falta GEMINI_API_KEY.");
  const productos = await muestra();
  const ia = new GoogleGenAI({ apiKey });
  const partes: string[] = [`# Piloto de sugerencias (${new Date().toISOString().slice(0, 16)})`, ""];
  const resumen: string[] = ["| Modelo | Con descripción | Con foto | Fallas | Tiempo medio | Costo total | Costo por producto |", "|---|---|---|---|---|---|---|"];

  for (const modelo of modelos) {
    const sugeridor = new SugeridorGemini(ia.models, modelo);
    const filas: string[] = ["| Producto | Descripción | Página de la foto | Imagen | Motivos | Fuentes | Búsquedas | US$ |", "|---|---|---|---|---|---|---|---|"];
    let costo = 0, conDescripcion = 0, conFoto = 0, fallas = 0, tiempo = 0;
    // De a 4 en paralelo.
    for (let i = 0; i < productos.length; i += 4) {
      const tanda = productos.slice(i, i + 4);
      const resultados = await Promise.all(
        tanda.map(async (p) => {
          const inicio = Date.now();
          try {
            return { p, s: await sugeridor.sugerir(p), ms: Date.now() - inicio };
          } catch (error) {
            return { p, error: error instanceof Error ? error.message : String(error), ms: Date.now() - inicio };
          }
        }),
      );
      for (const r of resultados) {
        tiempo += r.ms;
        if ("error" in r) {
          fallas++;
          filas.push(`| ${celda(r.p.nombre)} | FALLÓ: ${celda(r.error)} | | | | | | |`);
          continue;
        }
        const s: SugerenciaIA = r.s;
        const c = costoUsd(s.uso);
        costo += c;
        if (s.descripcion) conDescripcion++;
        if (s.paginaFoto || s.fotoUrl) conFoto++;
        filas.push(
          `| ${celda(r.p.nombre)} (${celda(r.p.bodega)}) | ${celda(s.descripcion)} | ${celda(s.paginaFoto)} | ${celda(s.fotoUrl)} | ${celda([s.motivoSinDescripcion, s.motivoSinFoto].filter(Boolean).join(" / "))} | ${s.fuentes.map((f) => f.titulo).join(", ")} | ${s.uso.busquedas} | ${c.toFixed(4)} |`,
        );
      }
    }
    resumen.push(
      `| ${modelo} | ${conDescripcion}/${productos.length} | ${conFoto}/${productos.length} | ${fallas} | ${(tiempo / productos.length / 1000).toFixed(1)} s | ${costo.toFixed(3)} | ${(costo / Math.max(1, productos.length - fallas)).toFixed(4)} |`,
    );
    partes.push(`## ${modelo}`, "", ...filas, "");
  }
  mkdirSync("piloto-ia", { recursive: true });
  const archivo = `piloto-ia/piloto-${Date.now()}.md`;
  writeFileSync(archivo, [partes[0], "", "## Resumen", "", ...resumen, "", ...partes.slice(2)].join("\n"));
  console.log(`Informe: ${archivo}\n${resumen.join("\n")}`);
});
