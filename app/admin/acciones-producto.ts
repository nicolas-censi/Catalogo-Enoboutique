"use server";

import { redirect } from "next/navigation";
import { exigirPersonal } from "@/lib/admin/acceso";
import { invalidarCarta } from "@/lib/admin/cache";
import { traducirError } from "@/lib/admin/errores";
import { validarProducto } from "@/lib/admin/validacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export type CampoProducto = "tipo" | "nombre";
export type EstadoProducto = {
  errores: Partial<Record<CampoProducto, string>>;
  error: string | null;
  guardado: boolean;
  /** Lo que se envió, para no perderlo si hay errores. */
  valores: Record<string, string> | null;
};

type Cliente = Awaited<ReturnType<typeof crearClienteServidor>>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const escaparLike = (texto: string) => texto.replace(/[\\%_]/g, (c) => `\\${c}`);

/** Busca la bodega por nombre (sin importar mayúsculas) o la crea. */
async function resolverBodega(supabase: Cliente, nombre: string): Promise<{ id: string | null; error: string | null }> {
  if (!nombre) return { id: null, error: null };
  const existente = await supabase.from("bodegas").select("id").ilike("nombre", escaparLike(nombre)).limit(1).maybeSingle();
  if (existente.data) return { id: existente.data.id, error: null };
  const nueva = await supabase.from("bodegas").insert({ nombre }).select("id").single();
  if (nueva.error) return { id: null, error: traducirError(nueva.error, { bodega: nombre }) };
  return { id: nueva.data.id, error: null };
}

export async function guardarProducto(
  productoId: string | null,
  _estado: EstadoProducto,
  formulario: FormData,
): Promise<EstadoProducto> {
  await exigirPersonal();
  const valores = Object.fromEntries(
    [...formulario.entries()].filter(([, v]) => typeof v === "string") as [string, string][],
  );
  const { datos, errores } = validarProducto({ ...valores, visible: formulario.get("visible") === "on" });
  if (!datos) return { errores, error: null, guardado: false, valores };

  const supabase = await crearClienteServidor();
  const bodega = await resolverBodega(supabase, (valores.bodega ?? "").trim());
  if (bodega.error) return { errores: {}, error: bodega.error, guardado: false, valores };
  const fila = {
    ...datos,
    bodega_id: bodega.id,
    seccion_id: UUID.test(valores.seccion ?? "") ? valores.seccion : null,
  };

  if (productoId) {
    const { error } = await supabase.from("productos").update(fila).eq("id", productoId);
    if (error) return { errores: {}, error: traducirError(error), guardado: false, valores };
    invalidarCarta();
    return { errores: {}, error: null, guardado: true, valores };
  }

  const { data, error } = await supabase.from("productos").insert(fila).select("id").single();
  if (error) return { errores: {}, error: traducirError(error), guardado: false, valores };
  invalidarCarta();
  redirect(`/admin/productos/${data.id}`);
}
