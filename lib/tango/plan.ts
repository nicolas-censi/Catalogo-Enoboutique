// Plan de una importación de Tango (spec 008): qué se crea y qué cambia, comparando el
// reporte con lo que ya hay en la carta. Función pura: no toca la base. La base lo aplica
// después, todo junto (aplicar_importacion).
import { agrupar, separarAnada } from "@/lib/tango/anadas";
import { bodegaPorCodigo, nombreSugeridoBodega, seccionSugerida } from "@/lib/tango/clasificar";
import { nombreLegible, varietal, type Abreviatura } from "@/lib/tango/nombres";
import type { Reporte, TipoTango } from "@/lib/tango/reporte";

type TipoProducto = "vino" | "destilado" | "aceite" | "almacen";
type TipoAnada = "con_anio" | "sin_especificar" | "sin_anada";

export type EstadoActual = {
  /** Todavía no se aplicó ninguna importación (CA-7). */
  primera: boolean;
  anadas: {
    codigo: string;
    productoId: string;
    nombreProducto: string;
    tipoProducto: TipoProducto;
    descripcion: string;
    anio: number | null;
    precio: number | null;
  }[];
  bodegas: { id: string; codigo: string | null; nombre: string }[];
  /** Secciones de primer nivel. */
  secciones: { id: string; nombre: string; tieneSubsecciones: boolean }[];
  codigosBarras: { codigo: string; productoId: string }[];
};

export type AnadaPlan = { codigo: string; descripcion: string; tipo: TipoAnada; anio: number | null; precio: number | null; enStock: boolean };

export type Plan = {
  primera: boolean;
  bodegasNuevas: { codigo: string; nombre: string; existenteId: string | null }[];
  seccionesNuevas: string[];
  productosNuevos: {
    tipo: TipoProducto;
    nombre: string;
    varietal: string | null;
    bodegaCodigo: string | null;
    /** Nombre de la sección (existente o nueva), o null: sin sección. */
    seccion: string | null;
    /** Sección o subsección que eligió el encargado (CA-11); pisa a `seccion`. */
    seccionId?: string | null;
    visible: boolean;
    codigosBarras: string[];
    anadas: AnadaPlan[];
  }[];
  anadasNuevas: (AnadaPlan & { productoId: string })[];
  precios: { codigo: string; anterior: number | null; nuevo: number | null }[];
  codigosBarrasNuevos: { productoId: string; codigo: string }[];
  resumen: {
    productosNuevos: number;
    anadasNuevas: number;
    preciosCambian: number;
    sinCambios: number;
    noSeImportan: number;
    sinSeccion: number;
    faltanEnArchivo: string[];
    problemas: string[];
  };
};

const TIPO_PRODUCTO: Record<TipoTango, TipoProducto> = {
  vino: "vino",
  combo: "vino",
  destilado: "destilado",
  aceite: "aceite",
  almacen: "almacen",
};

const comparable = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

export function planear(reporte: Reporte, estado: EstadoActual, diccionario: Abreviatura[], anioActual?: number): Plan {
  const problemas = [...reporte.problemas];
  const importables = reporte.articulos.filter((a) => a.tipo);
  const porCodigo = new Map(estado.anadas.map((a) => [a.codigo, a]));
  const barrasUsados = new Map(estado.codigosBarras.map((c) => [c.codigo, c.productoId]));
  const enStockNuevo = estado.primera;

  for (const a of reporte.articulos) {
    if (a.codigoBarrasInvalido) problemas.push(`${a.codigo}: el código de barras «${a.codigoBarrasInvalido}» no es válido; no se importa.`);
  }

  /** Suma un código de barras a un producto, salvo que ya sea de otro. */
  const usarBarras = (codigoArticulo: string, barras: string | null, productoId: string, destino: string[]) => {
    if (!barras) return;
    const dueno = barrasUsados.get(barras);
    if (dueno === productoId) return;
    if (dueno) return void problemas.push(`${codigoArticulo}: el código de barras ${barras} ya es de otro producto; no se importa.`);
    barrasUsados.set(barras, productoId);
    destino.push(barras);
  };

  // Artículos que ya están: se actualiza el precio (CA-8).
  const precios: Plan["precios"] = [];
  const codigosBarrasNuevos: Plan["codigosBarrasNuevos"] = [];
  let sinCambios = 0;
  for (const a of importables) {
    const actual = porCodigo.get(a.codigo);
    if (!actual) continue;
    if (actual.precio !== a.precio) precios.push({ codigo: a.codigo, anterior: actual.precio, nuevo: a.precio });
    else sinCambios++;
    const nuevos: string[] = [];
    usarBarras(a.codigo, a.codigoBarras, actual.productoId, nuevos);
    codigosBarrasNuevos.push(...nuevos.map((codigo) => ({ productoId: actual.productoId, codigo })));
  }

  // Vinos que ya están, por su clave, para sumarles las añadas nuevas.
  const vinosExistentes = new Map<string, { productoId: string; nombre: string; anios: Set<number> }>();
  for (const a of estado.anadas) {
    if (a.tipoProducto !== "vino") continue;
    const clave = separarAnada(a.descripcion, anioActual).clave;
    const vino = vinosExistentes.get(clave) ?? { productoId: a.productoId, nombre: a.nombreProducto, anios: new Set<number>() };
    if (a.anio !== null) vino.anios.add(a.anio);
    vinosExistentes.set(clave, vino);
  }

  const grupos = agrupar(
    importables.filter((a) => !porCodigo.has(a.codigo)),
    anioActual,
  );
  const anadasNuevas: Plan["anadasNuevas"] = [];
  const productosNuevos: Plan["productosNuevos"] = [];
  const seccionesNuevas: string[] = [];
  const seccionPorNombre = new Map(estado.secciones.map((s) => [comparable(s.nombre), s]));
  const descripcionesPorBodega = new Map<string, string[]>();

  for (const grupo of grupos) {
    problemas.push(...grupo.problemas);
    const existente = grupo.tipo === "vino" ? vinosExistentes.get(grupo.clave) : undefined;
    if (existente) {
      // Otra añada de un vino que ya está en la carta: no se publica sola (CA-8).
      for (const a of grupo.articulos) {
        let anio = a.anio;
        if (anio !== null && existente.anios.has(anio)) {
          problemas.push(`${a.codigo}: ${existente.nombre} ya tiene la añada ${anio}; queda sin especificar.`);
          anio = null;
        }
        if (anio !== null) existente.anios.add(anio);
        anadasNuevas.push({
          productoId: existente.productoId,
          codigo: a.codigo,
          descripcion: a.descripcion,
          tipo: anio === null ? "sin_especificar" : "con_anio",
          anio,
          precio: a.precio,
          enStock: enStockNuevo,
        });
        const nuevos: string[] = [];
        usarBarras(a.codigo, a.codigoBarras, existente.productoId, nuevos);
        codigosBarrasNuevos.push(...nuevos.map((codigo) => ({ productoId: existente.productoId, codigo })));
      }
      continue;
    }

    const primero = grupo.articulos[0];
    const esVino = grupo.tipo === "vino";
    const base = esVino ? grupo.clave : primero.descripcion;
    let seccion = seccionSugerida(grupo.tipo, primero.descripcion);
    if (seccion) {
      const actual = seccionPorNombre.get(comparable(seccion));
      // Con subsecciones, el personal elige la subsección (spec 011).
      if (actual?.tieneSubsecciones) seccion = null;
      else if (actual) seccion = actual.nombre;
      else if (!seccionesNuevas.includes(seccion)) seccionesNuevas.push(seccion);
    }
    const bodegaCodigo = bodegaPorCodigo(primero.codigo, grupo.tipo);
    if (bodegaCodigo) {
      descripcionesPorBodega.set(bodegaCodigo, [...(descripcionesPorBodega.get(bodegaCodigo) ?? []), ...grupo.articulos.map((a) => a.descripcion)]);
    }
    const codigosBarras: string[] = [];
    const referencia = `nuevo:${productosNuevos.length}`;
    for (const a of grupo.articulos) usarBarras(a.codigo, a.codigoBarras, referencia, codigosBarras);
    productosNuevos.push({
      tipo: TIPO_PRODUCTO[grupo.tipo],
      nombre: nombreLegible(base, diccionario),
      varietal: esVino ? varietal(base, diccionario) : null,
      bodegaCodigo,
      seccion,
      // En la primera importación se publica todo; después, lo nuevo se revisa antes (CA-7, CA-8).
      visible: estado.primera,
      codigosBarras,
      anadas: grupo.articulos.map((a) => ({
        codigo: a.codigo,
        descripcion: a.descripcion,
        tipo: !esVino ? "sin_anada" : a.anio === null ? "sin_especificar" : "con_anio",
        anio: esVino ? a.anio : null,
        precio: a.precio,
        enStock: true,
      })),
    });
  }

  // Bodegas nuevas: por código; si ya hay una con ese nombre sin código, se usa esa.
  // Los nombres de bodega no se repiten: si el sugerido ya está usado, se le agrega el
  // código ("Callejón (cdc)") para que el encargado lo corrija.
  const bodegasNuevas: Plan["bodegasNuevas"] = [];
  const conCodigo = new Set(estado.bodegas.map((b) => b.codigo).filter(Boolean));
  const nombresUsados = new Set(estado.bodegas.map((b) => comparable(b.nombre)));
  const asignadas = new Set<string>();
  for (const [codigo, descripciones] of descripcionesPorBodega) {
    if (conCodigo.has(codigo)) continue;
    const sugerido = nombreSugeridoBodega(descripciones, diccionario) ?? codigo.toUpperCase();
    const mismoNombre = estado.bodegas.find((b) => comparable(b.nombre) === comparable(sugerido));
    if (mismoNombre && !mismoNombre.codigo && !asignadas.has(mismoNombre.id)) {
      asignadas.add(mismoNombre.id);
      bodegasNuevas.push({ codigo, nombre: mismoNombre.nombre, existenteId: mismoNombre.id });
      continue;
    }
    const nombre = nombresUsados.has(comparable(sugerido)) ? `${sugerido} (${codigo})` : sugerido;
    nombresUsados.add(comparable(nombre));
    bodegasNuevas.push({ codigo, nombre, existenteId: null });
  }

  const enArchivo = new Set(reporte.articulos.map((a) => a.codigo));
  return {
    primera: estado.primera,
    bodegasNuevas,
    seccionesNuevas,
    productosNuevos,
    anadasNuevas,
    precios,
    codigosBarrasNuevos,
    resumen: {
      productosNuevos: productosNuevos.length,
      anadasNuevas: anadasNuevas.length + productosNuevos.reduce((n, p) => n + p.anadas.length, 0),
      preciosCambian: precios.length,
      sinCambios,
      noSeImportan: reporte.articulos.length - importables.length,
      sinSeccion: productosNuevos.filter((p) => !p.seccion).length,
      faltanEnArchivo: estado.anadas.map((a) => a.codigo).filter((c) => !enArchivo.has(c)),
      problemas,
    },
  };
}

/**
 * Elección del encargado para un producto nuevo (CA-11): "" sin sección, "id:<uuid>" una
 * sección o subsección que ya existe, "nueva:<nombre>" una que crea la importación.
 */
export type EleccionSeccion = string;

/** Aplica al plan las secciones que eligió el encargado, por posición del producto. */
export function aplicarElecciones(plan: Plan, elecciones: Record<number, EleccionSeccion>): Plan {
  const productosNuevos = plan.productosNuevos.map((p, i) => {
    const eleccion = elecciones[i];
    if (eleccion === undefined) return p;
    if (eleccion.startsWith("id:")) return { ...p, seccion: null, seccionId: eleccion.slice(3) };
    if (eleccion.startsWith("nueva:")) return { ...p, seccion: eleccion.slice(6), seccionId: null };
    return { ...p, seccion: null, seccionId: null };
  });
  // Solo se crean las secciones nuevas que quedaron en uso.
  const usadas = new Set(productosNuevos.filter((p) => !p.seccionId && p.seccion).map((p) => p.seccion));
  return {
    ...plan,
    productosNuevos,
    seccionesNuevas: plan.seccionesNuevas.filter((s) => usadas.has(s)),
    resumen: { ...plan.resumen, sinSeccion: productosNuevos.filter((p) => !p.seccion && !p.seccionId).length },
  };
}
