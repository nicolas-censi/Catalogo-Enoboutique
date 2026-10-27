import type { Anada } from "@/lib/carta";
import { formatearPrecio } from "@/lib/formato";

export function ListaAnadas({ anadas }: { anadas: Anada[] }) {
  return (
    <ul className="mt-2 divide-y divide-dorado/20">
      {anadas.map((anada) => (
        <li key={anada.id} className="flex items-baseline justify-between gap-4 py-1.5">
          <span className="tabular-nums text-texto-suave">{anada.etiqueta}</span>
          <span className="font-semibold tabular-nums text-destacado">{formatearPrecio(anada.precio)}</span>
        </li>
      ))}
    </ul>
  );
}
