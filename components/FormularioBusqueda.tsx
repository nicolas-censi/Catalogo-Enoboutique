import type { ChangeEventHandler, ReactNode } from "react";
import { textos } from "@/lib/textos";

/**
 * Buscador como una línea dorada (spec 013). Funciona sin JavaScript: la lupa envía a
 * /buscar?q=...
 */
export function FormularioBusqueda({
  valor = "",
  onChange,
  accesorio,
}: {
  valor?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  /** Algo más al final de la fila, por ejemplo el botón de escanear. */
  accesorio?: ReactNode;
}) {
  return (
    <form role="search" action="/buscar" method="get" className="flex items-center gap-1 border-b border-dorado/50 focus-within:border-dorado">
      <button type="submit" aria-label={textos.buscadorBoton} className="tocable inline-flex size-11 shrink-0 items-center justify-center text-dorado">
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>
      <input
        type="search"
        name="q"
        defaultValue={valor}
        onChange={onChange}
        aria-label={textos.buscadorEtiqueta}
        placeholder={textos.buscadorAyuda}
        autoComplete="off"
        enterKeyHint="search"
        className="min-h-12 min-w-0 flex-1 bg-transparent text-[1.0625rem] text-texto placeholder:text-texto-suave focus:outline-none"
      />
      {accesorio}
    </form>
  );
}
