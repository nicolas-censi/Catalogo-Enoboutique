"use server";

import { revalidatePath } from "next/cache";
import { exigirPersonal } from "@/lib/admin/acceso";
import { invalidarCarta } from "@/lib/admin/cache";
import { traducirError } from "@/lib/admin/errores";
import { validarCodigoBarras } from "@/lib/admin/validacion";
import { crearClienteServidor } from "@/lib/supabase/server";

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
