import type { Anada } from "@/lib/carta";
import { formatearPrecio } from "@/lib/formato";

/** Añadas con puntos guía hasta el precio, como en una carta de restaurante (spec 013). */
export function ListaAnadas({ anadas }: { anadas: Anada[] }) {
  return (
    <ul className="mt-2 flex flex-col gap-1">
      {anadas.map((anada) => (
        <li key={anada.id} className="flex items-baseline justify-end gap-2">
          {/* Sin año (por ejemplo, un destilado): solo el precio, sin puntos guía. */}
          {anada.etiqueta && (
            <>
              <span className="tabular-nums">{anada.etiqueta}</span>
              <span aria-hidden="true" className="min-w-4 flex-1 -translate-y-1 border-b border-dotted border-texto-suave/40" />
            </>
          )}
          <span className="font-semibold tabular-nums text-destacado">{formatearPrecio(anada.precio)}</span>
        </li>
      ))}
    </ul>
  );
}
