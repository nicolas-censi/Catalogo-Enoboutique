// Spec 014, CA-3: tres pesos de botón. Uno solo "principal" por pantalla.
export type Variante = "principal" | "secundario" | "texto" | "peligro";

const base =
  "inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 font-medium disabled:cursor-default disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-texto";

const variantes: Record<Variante, string> = {
  principal: "bg-boton text-boton-texto",
  secundario: "border border-control bg-superficie text-texto",
  texto: "text-texto underline-offset-4 hover:underline",
  peligro: "border border-error text-error bg-superficie",
};

/** Clases de botón (sirve también para enlaces con forma de botón). */
export function claseBoton(variante: Variante = "secundario", extra = "") {
  return `${base} ${variantes[variante]} ${extra}`.trim();
}
