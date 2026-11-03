// Spec 014: enlaces de la lista de productos con los filtros (?q=&seccion=&estado=&pagina=).
import type { EstadoFiltro, Filtros } from "@/lib/admin/productos";

export function enlaceLista(filtros: Pick<Filtros, "q" | "seccion" | "estado">, cambios: Partial<{ q: string; seccion: string; estado: EstadoFiltro | ""; pagina: number }> = {}) {
  const f = { ...filtros, pagina: 1, ...cambios };
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.seccion) p.set("seccion", f.seccion);
  if (f.estado) p.set("estado", f.estado);
  if (f.pagina > 1) p.set("pagina", String(f.pagina));
  const consulta = p.toString();
  return consulta ? `/admin?${consulta}` : "/admin";
}
