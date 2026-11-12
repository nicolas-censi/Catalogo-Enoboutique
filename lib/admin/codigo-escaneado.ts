// Spec 019, CA-1: qué hacer con un código leído con la cámara en la ficha de un producto.
// Recibe los códigos ya cargados que coinciden con lo leído (o con sus variantes: con o
// sin el 0 adelante). Función pura: se testea sin base ni cámara.

export type CodigoCargado = { codigo: string; productoId: string; nombre: string };
export type DecisionEscaneo =
  | { tipo: "agregar"; codigo: string }
  | { tipo: "ya-estaba"; codigo: string }
  | { tipo: "de-otro"; codigo: string; nombre: string };

export function decidirEscaneo(leido: string, cargados: CodigoCargado[], productoId: string): DecisionEscaneo {
  const propio = cargados.find((c) => c.productoId === productoId);
  if (propio) return { tipo: "ya-estaba", codigo: propio.codigo };
  const ajeno = cargados[0];
  if (ajeno) return { tipo: "de-otro", codigo: ajeno.codigo, nombre: ajeno.nombre };
  return { tipo: "agregar", codigo: leido };
}
