"use server";

import { revalidatePath } from "next/cache";
import { exigirPersonal } from "@/lib/admin/acceso";
import { invalidarCarta } from "@/lib/admin/cache";
import { idsProductosAdmin, leerFiltros, type Filtros } from "@/lib/admin/productos";
import { nombreConSeccion } from "@/lib/admin/secciones";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

const t = textos.admin.mover;
const TANDA = 200;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Mueve varios productos a una sección o subsección (spec 008, CA-12): los tildados o,
 * con `filtros`, todos los que coinciden (en todas las páginas).
 */
export async function moverProductos(
  seleccion: { ids: string[] } | { filtros: Filtros },
  seccionId: string,
): Promise<{ error: string | null; aviso: string | null }> {
  await exigirPersonal();
  if (!UUID.test(seccionId)) return { error: t.elegirSeccion, aviso: null };
  const supabase = await crearClienteServidor();
  const { data: seccion } = await supabase.from("secciones").select("id, nombre, seccion_padre_id").eq("id", seccionId).maybeSingle();
  if (!seccion) return { error: t.elegirSeccion, aviso: null };
  const padre = seccion.seccion_padre_id
    ? (await supabase.from("secciones").select("nombre").eq("id", seccion.seccion_padre_id).single()).data
    : null;

  // Lo que llega del navegador se vuelve a validar antes de usarlo en las consultas.
  const ids =
    "ids" in seleccion
      ? seleccion.ids.filter((id) => UUID.test(id))
      : await idsProductosAdmin(supabase, leerFiltros({ q: seleccion.filtros.q, seccion: seleccion.filtros.seccion, estado: seleccion.filtros.estado }));
  for (let i = 0; i < ids.length; i += TANDA) {
    const { error } = await supabase.from("productos").update({ seccion_id: seccionId }).in("id", ids.slice(i, i + TANDA));
    // Por ejemplo, una sección que tiene subsecciones (spec 011): el mensaje lo explica.
    if (error) return { error: error.code === "23514" ? error.message : textos.admin.errorGuardar, aviso: null };
  }
  invalidarCarta();
  revalidatePath("/admin", "layout");
  return { error: null, aviso: t.movidos(ids.length, padre ? nombreConSeccion(padre.nombre, seccion.nombre) : seccion.nombre) };
}
