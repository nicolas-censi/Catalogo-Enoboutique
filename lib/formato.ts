import { textos } from "@/lib/textos";

const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatearPrecio(valor: number | null): string {
  return valor === null ? textos.consultarPrecio : pesos.format(valor);
}

const dolares = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Dólares con dos decimales (spec 007): "12,40". Un costo chico pero no cero muestra "0,01". */
export function formatearDolares(valor: number): string {
  return dolares.format(valor > 0 && valor < 0.01 ? 0.01 : valor);
}
