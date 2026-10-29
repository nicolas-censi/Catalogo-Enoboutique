"use server";

import { revalidatePath } from "next/cache";
import { readSheet } from "read-excel-file/node";
import { invalidarCarta } from "@/lib/admin/cache";
import { leerDiccionario, leerEstadoActual } from "@/lib/admin/importacion";
import { listarSeccionesAdmin } from "@/lib/admin/productos";
import { nombreConSeccion } from "@/lib/admin/secciones";
import { obtenerSesionPanel } from "@/lib/admin/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { aplicarElecciones, planear, type EleccionSeccion, type Plan } from "@/lib/tango/plan";
import { filasDeCsv, leerReporte } from "@/lib/tango/reporte";
import { textos } from "@/lib/textos";

const t = textos.admin.importar;
const MUESTRA = 50;

async function exigirEncargado() {
  const sesion = await obtenerSesionPanel();
  if (sesion?.rol !== "encargado") throw new Error(textos.admin.sinAcceso);
}

export type ImportacionPreparada = {
  id: string;
  archivo: string;
  resumen: Plan["resumen"];
  primera: boolean;
  /** Las primeras, para mostrar (el resto se cuenta). */
  precios: Plan["precios"];
  /** Todos los productos nuevos, con la sección sugerida como elección inicial (CA-11). */
  nuevos: { nombre: string; seccion: EleccionSeccion; anadas: number }[];
  /** Secciones elegibles: las que no tienen subsecciones, las subsecciones y las nuevas. */
  opciones: { valor: EleccionSeccion; etiqueta: string; grupo: string | null }[];
};
export type EstadoImportacion = { error: string | null; preparada: ImportacionPreparada | null };

async function leerFilas(archivo: File): Promise<unknown[][]> {
  const bytes = Buffer.from(await archivo.arrayBuffer());
  if (/\.csv$/i.test(archivo.name) || archivo.type === "text/csv") {
    // Tango puede exportar en UTF-8 o en Windows-1252 (con tildes).
    let texto: string;
    try {
      texto = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      texto = new TextDecoder("windows-1252").decode(bytes);
    }
    return filasDeCsv(texto);
  }
  return readSheet(bytes);
}

/** Lee el reporte, arma el plan y lo guarda sin aplicarlo (CA-1). */
export async function prepararImportacion(_estado: EstadoImportacion, formulario: FormData): Promise<EstadoImportacion> {
  await exigirEncargado();
  const archivo = formulario.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) return { error: t.elegirArchivo, preparada: null };

  let filas: unknown[][];
  try {
    filas = await leerFilas(archivo);
  } catch {
    return { error: t.noSePudoLeer, preparada: null };
  }
  const reporte = leerReporte(filas);
  if (reporte.faltan.length > 0) return { error: t.faltanColumnas(reporte.faltan), preparada: null };

  const supabase = await crearClienteServidor();
  const [estado, diccionario] = await Promise.all([leerEstadoActual(supabase), leerDiccionario(supabase)]);
  const plan = planear(reporte, estado, diccionario);
  const secciones = await listarSeccionesAdmin(supabase);
  // La sugerida, como valor del selector: una sección que ya existe o una que se crea.
  const porNombre = new Map(secciones.filter((x) => x.subsecciones.length === 0).map((x) => [x.nombre.toLowerCase(), x.id]));
  const eleccionInicial = (seccion: string | null): EleccionSeccion => {
    if (!seccion) return "";
    const id = porNombre.get(seccion.toLowerCase());
    return id ? `id:${id}` : `nueva:${seccion}`;
  };
  const { data, error } = await supabase.from("importaciones").insert({ plan }).select("id").single();
  if (error) return { error: textos.admin.errorGuardar, preparada: null };
  return {
    error: null,
    preparada: {
      id: data.id,
      archivo: archivo.name,
      resumen: plan.resumen,
      primera: plan.primera,
      precios: plan.precios.slice(0, MUESTRA),
      nuevos: plan.productosNuevos.map((p) => ({ nombre: p.nombre, seccion: eleccionInicial(p.seccion), anadas: p.anadas.length })),
      opciones: [
        ...secciones.flatMap((s): ImportacionPreparada["opciones"] =>
          s.subsecciones.length === 0
            ? [{ valor: `id:${s.id}`, etiqueta: s.nombre, grupo: null }]
            : s.subsecciones.map((h) => ({ valor: `id:${h.id}`, etiqueta: nombreConSeccion(s.nombre, h.nombre), grupo: s.nombre })),
        ),
        ...plan.seccionesNuevas.map((nombre) => ({ valor: `nueva:${nombre}`, etiqueta: t.seccionNueva(nombre), grupo: null })),
      ],
    },
  };
}

/** Aplica el plan todo junto (CA-1), con las secciones elegidas (CA-11), y muestra lo hecho (CA-10). */
export async function confirmarImportacion(id: string, elecciones: Record<number, EleccionSeccion> = {}): Promise<{ error: string | null }> {
  await exigirEncargado();
  const supabase = await crearClienteServidor();
  if (Object.keys(elecciones).length > 0) {
    const guardada = await supabase.from("importaciones").select("plan").eq("id", id).eq("estado", "pendiente").maybeSingle();
    if (guardada.error || !guardada.data) return { error: t.yaAplicada };
    const plan = aplicarElecciones(guardada.data.plan as unknown as Plan, elecciones);
    const actualizada = await supabase.from("importaciones").update({ plan: plan as never }).eq("id", id);
    if (actualizada.error) return { error: textos.admin.errorGuardar };
  }
  const { error } = await supabase.rpc("aplicar_importacion", { importacion: id });
  if (error) return { error: error.code === "23514" ? error.message : textos.admin.errorGuardar };
  invalidarCarta();
  revalidatePath("/admin", "layout");
  return { error: null };
}

export type EstadoAbreviatura = { errores: Partial<Record<"abreviatura" | "expansion", string>>; error: string | null; guardadas: number };

/** Agrega una abreviatura o cambia la que ya existe con ese texto (CA-4). */
export async function guardarAbreviatura(estado: EstadoAbreviatura, formulario: FormData): Promise<EstadoAbreviatura> {
  await exigirEncargado();
  const abreviatura = String(formulario.get("abreviatura") ?? "").trim().toUpperCase().replace(/\s+/g, " ");
  const expansion = String(formulario.get("expansion") ?? "").trim();
  const errores: EstadoAbreviatura["errores"] = {};
  if (!abreviatura) errores.abreviatura = t.abreviaturas.faltaAbreviatura;
  if (!expansion) errores.expansion = t.abreviaturas.faltaExpansion;
  if (Object.keys(errores).length > 0) return { ...estado, errores, error: null };
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("abreviaturas")
    .upsert({ abreviatura, expansion, es_varietal: formulario.get("es_varietal") === "on" });
  if (error) return { ...estado, errores: {}, error: textos.admin.errorGuardar };
  revalidatePath("/admin/importar/abreviaturas");
  return { errores: {}, error: null, guardadas: estado.guardadas + 1 };
}

export async function borrarAbreviatura(abreviatura: string): Promise<{ error: string | null }> {
  await exigirEncargado();
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("abreviaturas").delete().eq("abreviatura", abreviatura);
  if (error) return { error: textos.admin.errorGuardar };
  revalidatePath("/admin/importar/abreviaturas");
  return { error: null };
}

/** Corrige el nombre que la importación propuso para una bodega (CA-5). */
export async function renombrarBodega(id: string, nombre: string): Promise<{ error: string | null }> {
  await exigirEncargado();
  if (!nombre.trim()) return { error: t.bodegas.faltaNombre };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("bodegas").update({ nombre: nombre.trim() }).eq("id", id);
  if (error) return { error: error.code === "23505" ? t.bodegas.repetida : textos.admin.errorGuardar };
  invalidarCarta();
  revalidatePath("/admin", "layout");
  return { error: null };
}
