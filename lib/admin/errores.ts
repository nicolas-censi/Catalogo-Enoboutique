// Traduce los errores de la base (Postgres vía Supabase) a mensajes para el personal.
import { unProducto, type TipoProducto } from "@/lib/admin/validacion";

export type ErrorBase = { code?: string; message?: string; details?: string | null };

const GENERICO = "No se pudo guardar. Probá de nuevo.";

/** Valor de la clave repetida: "Key (codigo)=(7798…) already exists." → "7798…". */
function valorRepetido(detalle: string | null | undefined): string[] {
  const m = detalle?.match(/=\((.*)\) already exists/);
  return m ? m[1].split(",").map((v) => v.trim()) : [];
}

/**
 * Lo que se intentó guardar. Hace falta porque, en tablas con seguridad por filas
 * (RLS), Postgres no incluye en el error el valor repetido para no filtrar datos.
 */
export type ContextoError = {
  codigoTango?: string;
  anio?: number | null;
  codigoBarras?: string;
  bodega?: string;
  productoDelCodigo?: string;
};

export function traducirError(error: ErrorBase, contexto: ContextoError = {}): string {
  const mensaje = error.message ?? "";
  if (error.code === "23505") {
    const valores = valorRepetido(error.details);
    if (mensaje.includes("anadas_codigo_tango_key")) {
      return `Ya existe una añada con el código ${valores[0] ?? contexto.codigoTango}.`;
    }
    if (mensaje.includes("anadas_producto_anio_unico")) {
      return `Este vino ya tiene la añada ${valores[1] ?? contexto.anio}.`;
    }
    if (mensaje.includes("codigos_barras_pkey")) {
      return `El código ${valores[0] ?? contexto.codigoBarras} ya es de ${contexto.productoDelCodigo ?? "otro producto"}.`;
    }
    if (mensaje.includes("bodegas_nombre_key")) return `Ya existe la bodega ${valores[0] ?? contexto.bodega}.`;
  }
  if (error.code === "23514" && /^No podés /.test(mensaje)) return mensaje;
  if (error.code === "23514") {
    const tipo = mensaje.match(/Un producto de tipo (\w+)/)?.[1] as TipoProducto | undefined;
    if (tipo) return `${unProducto(tipo)} tiene una sola presentación, sin año.`;
  }
  if (error.code === "42501") return "No tenés permiso para hacer esto.";
  return GENERICO;
}
