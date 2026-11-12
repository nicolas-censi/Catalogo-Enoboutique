"use server";

import { revalidatePath } from "next/cache";
import { exigirPersonal } from "@/lib/admin/acceso";
import { invalidarCarta } from "@/lib/admin/cache";
import { decidirEscaneo } from "@/lib/admin/codigo-escaneado";
import { traducirError } from "@/lib/admin/errores";
import { validarCodigoBarras } from "@/lib/admin/validacion";
import { variantesCodigo } from "@/lib/escaneo";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

export type EstadoCodigo = { errorCampo: string | null; error: string | null; guardados: number };

export async function agregarCodigo(productoId: string, estado: EstadoCodigo, formulario: FormData): Promise<EstadoCodigo> {
  await exigirPersonal();
  const { codigo, error: errorCampo } = validarCodigoBarras(String(formulario.get("codigo") ?? ""));
  if (errorCampo) return { ...estado, errorCampo, error: null };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("codigos_barras").insert({ codigo, producto_id: productoId });
  if (error) {
    // Si el código ya es de otro producto, se dice de cuál.
    const dueño = await supabase.from("codigos_barras").select("productos(nombre)").eq("codigo", codigo).maybeSingle();
    const nombre = (dueño.data?.productos as { nombre: string } | null)?.nombre;
    return { ...estado, errorCampo: null, error: traducirError(error, { codigoBarras: codigo, productoDelCodigo: nombre }) };
  }
  invalidarCarta();
  revalidatePath(`/admin/productos/${productoId}`);
  return { errorCampo: null, error: null, guardados: estado.guardados + 1 };
}

export async function quitarCodigo(productoId: string, codigo: string): Promise<{ error: string | null }> {
  await exigirPersonal();
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("codigos_barras").delete().eq("codigo", codigo).eq("producto_id", productoId);
  if (error) return { error: traducirError(error) };
  invalidarCarta();
  revalidatePath(`/admin/productos/${productoId}`);
  return { error: null };
}

/** Códigos ya cargados que coinciden con lo leído o con sus variantes (con o sin 0 adelante). */
async function cargadosComo(codigo: string) {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("codigos_barras").select("codigo, producto_id, productos(nombre)").in("codigo", variantesCodigo(codigo));
  return (data ?? []).map((c) => ({
    codigo: c.codigo,
    productoId: c.producto_id,
    nombre: (c.productos as { nombre: string } | null)?.nombre ?? "otro producto",
  }));
}

/** Spec 019, CA-1: agrega el código leído con la cámara, si no lo tiene nadie. */
export async function agregarCodigoEscaneado(productoId: string, leido: string): Promise<{ aviso: string | null; error: string | null }> {
  await exigirPersonal();
  const { codigo, error: invalido } = validarCodigoBarras(leido);
  if (invalido) return { aviso: null, error: invalido };
  const t = textos.admin.escanear;
  const decision = decidirEscaneo(codigo, await cargadosComo(codigo), productoId);
  if (decision.tipo === "ya-estaba") return { aviso: t.yaEstaba(decision.codigo), error: null };
  if (decision.tipo === "de-otro") return { aviso: null, error: t.deOtro(decision.codigo, decision.nombre) };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("codigos_barras").insert({ codigo, producto_id: productoId });
  if (error) return { aviso: null, error: traducirError(error, { codigoBarras: codigo }) };
  invalidarCarta();
  revalidatePath(`/admin/productos/${productoId}`);
  return { aviso: t.agregado(codigo), error: null };
}

/** Spec 019, CA-2: el producto que tiene este código (también ocultos o sin stock), si hay. */
export async function buscarPorCodigo(leido: string): Promise<{ id: string; nombre: string } | null> {
  await exigirPersonal();
  const encontrado = (await cargadosComo(leido))[0];
  return encontrado ? { id: encontrado.productoId, nombre: encontrado.nombre } : null;
}
