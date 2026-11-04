// Spec 007, T7 (CA-2): la cola de sugerencias pedidas de a muchos. Lógica pura con las
// dependencias inyectadas (la base y la IA): la usan la bandeja y la ruta del cron.
import type { Resultado } from "./tipos";

export const MAXIMO_POR_PEDIDO = 1000;
/** Productos por día (las búsquedas en Google tienen un tope de 1.500 por día). */
export const TOPE_DIARIO = 400;
export const POR_TANDA = 5;

type ProductoCandidato = { id: string; descripcion: string | null; foto_path: string | null };

/** Los que se van a pedir: sin descripción o sin foto (salvo `incluirCompletos`), sin una activa. */
export function elegirCandidatos(productos: ProductoCandidato[], conActiva: Set<string>, incluirCompletos: boolean) {
  const elegidos = productos.filter((p) => !conActiva.has(p.id) && (incluirCompletos || !p.descripcion?.trim() || !p.foto_path));
  return { ids: elegidos.slice(0, MAXIMO_POR_PEDIDO).map((p) => p.id), recortados: Math.max(0, elegidos.length - MAXIMO_POR_PEDIDO) };
}

export type DependenciasCola = {
  iaActiva: () => Promise<boolean>;
  tomar: (cantidad: number, tope: number) => Promise<{ id: string; producto_id: string }[]>;
  resolver: (id: string, productoId: string) => Promise<Resultado>;
  quedan: () => Promise<number>;
};

export type ResultadoTanda = { apagada: boolean; listas: number; fallidas: number; quedan: number; topeAlcanzado: boolean };

/** Procesa una tanda de la cola. Con la IA apagada no toma nada (CA-8). */
export async function procesarCola(deps: DependenciasCola): Promise<ResultadoTanda> {
  if (!(await deps.iaActiva())) return { apagada: true, listas: 0, fallidas: 0, quedan: await deps.quedan(), topeAlcanzado: false };
  const tomadas = await deps.tomar(POR_TANDA, TOPE_DIARIO);
  const resultados = await Promise.all(tomadas.map((s) => deps.resolver(s.id, s.producto_id)));
  const quedan = await deps.quedan();
  return {
    apagada: resultados.includes("apagada"),
    listas: resultados.filter((r) => r === "lista").length,
    fallidas: resultados.filter((r) => r === "fallo").length,
    quedan,
    topeAlcanzado: tomadas.length === 0 && quedan > 0,
  };
}
