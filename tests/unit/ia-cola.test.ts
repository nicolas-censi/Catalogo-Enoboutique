import { describe, expect, it } from "vitest";
import { elegirCandidatos, MAXIMO_POR_PEDIDO, procesarCola, TOPE_DIARIO } from "@/lib/ia/cola";

// Spec 007, T7 (CA-2): qué productos se piden y cómo avanza la cola.
const p = (id: string, descripcion: string | null, foto: string | null) => ({ id, descripcion, foto_path: foto });

describe("elegirCandidatos", () => {
  const productos = [p("a", null, null), p("b", "Texto", null), p("c", null, "f.webp"), p("d", "Texto", "f.webp"), p("e", null, null)];

  it("por defecto, solo los que no tienen descripción o no tienen foto, sin los que ya tienen una activa", () => {
    expect(elegirCandidatos(productos, new Set(["e"]), false)).toEqual({ ids: ["a", "b", "c"], recortados: 0 });
  });
  it("con Incluir los que ya tienen, también los completos", () => {
    expect(elegirCandidatos(productos, new Set(), true).ids).toEqual(["a", "b", "c", "d", "e"]);
  });
  it("hasta 1.000 por pedido; avisa cuántos quedaron afuera", () => {
    const muchos = Array.from({ length: MAXIMO_POR_PEDIDO + 5 }, (_, i) => p(`p${i}`, null, null));
    const r = elegirCandidatos(muchos, new Set(), false);
    expect(r.ids).toHaveLength(1000);
    expect(r.recortados).toBe(5);
  });
});

describe("procesarCola", () => {
  function dependencias(opciones: { activa?: boolean; cola?: string[]; fallan?: string[] } = {}) {
    const cola = [...(opciones.cola ?? [])];
    const resueltas: string[] = [];
    const topes: number[] = [];
    return {
      resueltas,
      topes,
      deps: {
        iaActiva: async () => opciones.activa ?? true,
        tomar: async (cantidad: number, tope: number) => {
          topes.push(tope);
          return cola.splice(0, cantidad).map((id) => ({ id, producto_id: `prod-${id}` }));
        },
        resolver: async (id: string) => {
          resueltas.push(id);
          return opciones.fallan?.includes(id) ? ("fallo" as const) : ("lista" as const);
        },
        quedan: async () => cola.length,
      },
    };
  }

  it("con la IA apagada no toma nada ni llama a la IA (CA-8)", async () => {
    const { deps, resueltas } = dependencias({ activa: false, cola: ["1", "2"] });
    expect(await procesarCola(deps)).toEqual({ apagada: true, listas: 0, fallidas: 0, quedan: 2, topeAlcanzado: false });
    expect(resueltas).toEqual([]);
  });

  it("procesa una tanda de 5 en paralelo con el tope diario y cuenta listas y fallidas", async () => {
    const { deps, resueltas, topes } = dependencias({ cola: ["1", "2", "3", "4", "5", "6", "7"], fallan: ["2"] });
    expect(await procesarCola(deps)).toEqual({ apagada: false, listas: 4, fallidas: 1, quedan: 2, topeAlcanzado: false });
    expect(resueltas).toEqual(["1", "2", "3", "4", "5"]);
    expect(topes).toEqual([TOPE_DIARIO]);
  });

  it("si quedan en cola pero no se pudo tomar ninguna, es que se llegó al tope del día", async () => {
    const { deps } = dependencias({ cola: ["1"] });
    deps.tomar = async () => [];
    expect((await procesarCola(deps)).topeAlcanzado).toBe(true);
  });
});
