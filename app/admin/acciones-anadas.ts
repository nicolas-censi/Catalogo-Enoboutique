"use server";

import { revalidatePath } from "next/cache";
import { exigirPersonal } from "@/lib/admin/acceso";
import { invalidarCarta } from "@/lib/admin/cache";
import { traducirError } from "@/lib/admin/errores";
import { validarAnada, type TipoProducto } from "@/lib/admin/validacion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

export type CampoAnada = "codigoTango" | "tipo" | "anio" | "precio";
export type EstadoAnada = {
  errores: Partial<Record<CampoAnada, string>>;
  error: string | null;
  /** Cuenta los guardados exitosos: el formulario de alta se vacía cuando cambia. */
  guardados: number;
};

export async function guardarAnada(
  productoId: string,
  anadaId: string | null,
  estado: EstadoAnada,
  formulario: FormData,
): Promise<EstadoAnada> {
  await exigirPersonal();
  const supabase = await crearClienteServidor();
  const producto = await supabase.from("productos").select("tipo").eq("id", productoId).single();
  if (producto.error) return { ...estado, errores: {}, error: textos.admin.errorGuardar };

  const entrada = Object.fromEntries(formulario.entries());
  const { datos, errores } = validarAnada(
    { ...entrada, enStock: formulario.get("enStock") === "on" },
    producto.data.tipo as TipoProducto,
  );
  if (!datos) return { ...estado, errores, error: null };
  const contexto = { codigoTango: datos.codigo_tango, anio: datos.anio };

  if (anadaId) {
    // Al editar no se toca el stock: eso lo maneja el interruptor.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { en_stock, ...cambios } = datos;
    const { error } = await supabase.from("anadas").update(cambios).eq("id", anadaId);
    if (error) return { ...estado, errores: {}, error: traducirError(error, contexto) };
  } else {
    const { error } = await supabase.from("anadas").insert({ ...datos, producto_id: productoId });
    if (error) return { ...estado, errores: {}, error: traducirError(error, contexto) };
  }

  invalidarCarta();
  revalidatePath(`/admin/productos/${productoId}`);
  return { errores: {}, error: null, guardados: estado.guardados + 1 };
}

export async function borrarAnada(productoId: string, anadaId: string): Promise<{ error: string | null }> {
  await exigirPersonal();
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("anadas").delete().eq("id", anadaId);
  if (error) return { error: traducirError(error) };
  invalidarCarta();
  revalidatePath(`/admin/productos/${productoId}`);
  return { error: null };
}
