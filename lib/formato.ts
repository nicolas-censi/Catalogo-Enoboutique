import { textos } from "@/lib/textos";

const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatearPrecio(valor: number | null): string {
  return valor === null ? textos.consultarPrecio : pesos.format(valor);
}
