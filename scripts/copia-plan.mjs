// Spec 009, T3: lógica pura de la copia de desarrollo a producción (se prueba sin red).
import { TABLAS } from "./tablas.mjs";

/** Lo creado por los tests lleva este prefijo (tests/db/ayudante.ts). */
export const PATRON_PRUEBA = /\btest-[a-z0-9]+-[0-9a-f]{6}\b/;

/** ¿La fila tiene algo creado por los tests? (en cualquier campo de texto). */
export const esDePrueba = (fila) => PATRON_PRUEBA.test(JSON.stringify(fila));

/** Tablas a copiar, en orden. `ajustes_ia` no: producción empieza con la IA apagada. */
export const TABLAS_A_COPIAR = TABLAS.filter((t) => t !== "ajustes_ia");

/**
 * Filtra y ordena las filas de cada tabla para producción: sin lo de los tests (ni lo
 * que depende de eso), secciones padre antes que sus subsecciones y, de las
 * sugerencias, solo las pendientes (en cola o listas para revisar).
 * @param {Record<string, any[]>} datos
 * @param {Set<string>} usuariosReales ids de auth.users que se copian
 */
export function planCopia(datos, usuariosReales) {
  /** @type {Record<string, any[]>} */
  const plan = {};
  const sinPrueba = (t) => (datos[t] ?? []).filter((f) => !esDePrueba(f));

  const secciones = sinPrueba("secciones");
  const idsSecciones = new Set(secciones.map((s) => s.id));
  plan.secciones = [
    ...secciones.filter((s) => !s.seccion_padre_id),
    ...secciones.filter((s) => s.seccion_padre_id && idsSecciones.has(s.seccion_padre_id)),
  ];
  plan.bodegas = sinPrueba("bodegas");
  plan.abreviaturas = sinPrueba("abreviaturas");
  const idsBodegas = new Set(plan.bodegas.map((b) => b.id));
  plan.productos = sinPrueba("productos").map((p) => ({
    ...p,
    seccion_id: p.seccion_id && idsSecciones.has(p.seccion_id) ? p.seccion_id : null,
    bodega_id: p.bodega_id && idsBodegas.has(p.bodega_id) ? p.bodega_id : null,
  }));
  const idsProductos = new Set(plan.productos.map((p) => p.id));
  const delProducto = (t) => sinPrueba(t).filter((f) => idsProductos.has(f.producto_id));
  plan.anadas = delProducto("anadas");
  plan.codigos_barras = delProducto("codigos_barras");
  plan.importaciones = sinPrueba("importaciones").map((i) => ({ ...i, creada_por: i.creada_por && usuariosReales.has(i.creada_por) ? i.creada_por : null }));
  plan.marca = sinPrueba("marca");
  plan.promociones = sinPrueba("promociones");
  plan.personal = sinPrueba("personal").filter((p) => usuariosReales.has(p.user_id));
  const usuario = (id) => (id && usuariosReales.has(id) ? id : null);
  plan.sugerencias = delProducto("sugerencias")
    .filter((s) => s.estado === "en_cola" || s.estado === "lista")
    .map((s) => ({ ...s, pedida_por: usuario(s.pedida_por), revisada_por: usuario(s.revisada_por) }));
  return plan;
}

/** Parte una lista en tandas. */
export function enTandas(lista, tamano = 400) {
  const tandas = [];
  for (let i = 0; i < lista.length; i += tamano) tandas.push(lista.slice(i, i + tamano));
  return tandas;
}

/** Literal SQL de un texto (comillas simples duplicadas). */
export const literal = (texto) => `'${String(texto).replaceAll("'", "''")}'`;
