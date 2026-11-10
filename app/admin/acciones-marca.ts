"use server";

import { revalidatePath } from "next/cache";
import { invalidarCarta } from "@/lib/admin/cache";
import { recortarLogo } from "@/lib/admin/logo";
import { rutaLogo, validarBienvenida } from "@/lib/admin/marca";
import { obtenerSesionPanel } from "@/lib/admin/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

async function exigirEncargado() {
  const sesion = await obtenerSesionPanel();
  if (sesion?.rol !== "encargado") throw new Error(textos.admin.sinAcceso);
}

function listo() {
  invalidarCarta();
  revalidatePath("/admin/marca");
}

export async function guardarBienvenida(texto: string): Promise<{ error: string | null }> {
  await exigirEncargado();
  const { bienvenida, error } = validarBienvenida(texto);
  if (error) return { error };
  const supabase = await crearClienteServidor();
  const r = await supabase.from("marca").update({ bienvenida }).eq("id", 1);
  if (r.error) return { error: textos.admin.errorGuardar };
  listo();
  return { error: null };
}

/** Usa el logo ya subido (desde el navegador), recortado al dibujo, y borra el anterior. */
export async function guardarLogo(ruta: string): Promise<{ error: string | null }> {
  await exigirEncargado();
  if (!/^logos\/[0-9a-f-]{36}\.(png|webp)$/.test(ruta)) return { error: textos.admin.errorGuardar };
  return cambiarLogo(await recortado(ruta));
}

/**
 * Spec 017, CA-3: sube el logo recortado como archivo nuevo (el bucket no deja reemplazar)
 * y borra el que subió el navegador. Si algo falla, se usa el subido tal cual.
 */
async function recortado(ruta: string): Promise<string> {
  const supabase = await crearClienteServidor();
  const formato = ruta.endsWith(".webp") ? "webp" : "png";
  try {
    const { data, error } = await supabase.storage.from("marca").download(ruta);
    if (error || !data) return ruta;
    const datos = await recortarLogo(Buffer.from(await data.arrayBuffer()), formato);
    const nueva = rutaLogo(formato);
    const subida = await supabase.storage.from("marca").upload(nueva, datos, { contentType: `image/${formato}` });
    if (subida.error) return ruta;
    await supabase.storage.from("marca").remove([ruta]);
    return nueva;
  } catch {
    return ruta;
  }
}

export async function volverLogoOriginal(): Promise<{ error: string | null }> {
  await exigirEncargado();
  return cambiarLogo(null);
}

async function cambiarLogo(ruta: string | null): Promise<{ error: string | null }> {
  const supabase = await crearClienteServidor();
  const anterior = await supabase.from("marca").select("logo_path").eq("id", 1).single();
  const { error } = await supabase.from("marca").update({ logo_path: ruta }).eq("id", 1);
  if (error) return { error: textos.admin.errorGuardar };
  if (anterior.data?.logo_path && anterior.data.logo_path !== ruta) {
    await supabase.storage.from("marca").remove([anterior.data.logo_path]);
  }
  listo();
  return { error: null };
}
