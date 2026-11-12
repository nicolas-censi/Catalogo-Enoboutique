// Spec 014: enlaces de la lista de productos con los filtros (?q=&seccion=&estado=&pagina=).
import type { EstadoFiltro, Filtros } from "@/lib/admin/productos";

export function enlaceLista(
  filtros: Pick<Filtros, "q" | "seccion" | "estado"> & { codigo?: string },
  cambios: Partial<{ q: string; seccion: string; estado: EstadoFiltro | ""; pagina: number; codigo: string }> = {},
) {
  const f = { ...filtros, pagina: 1, ...cambios };
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.seccion) p.set("seccion", f.seccion);
  if (f.estado) p.set("estado", f.estado);
  if (f.pagina > 1) p.set("pagina", String(f.pagina));
  if (f.codigo) p.set("codigo", f.codigo);
  const consulta = p.toString();
  return consulta ? `/admin?${consulta}` : "/admin";
}

/** Código de barras pendiente de asignar (spec 019, CA-2): solo 8 a 14 números. */
export function leerCodigoPendiente(valor: string | string[] | undefined): string {
  const codigo = (Array.isArray(valor) ? valor[0] : valor)?.trim() ?? "";
  return /^\d{8,14}$/.test(codigo) ? codigo : "";
}
