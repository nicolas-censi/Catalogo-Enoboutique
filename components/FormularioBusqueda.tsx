import type { ChangeEventHandler } from "react";
import { textos } from "@/lib/textos";

/** Buscador. Funciona sin JavaScript: envía a /buscar?q=... */
export function FormularioBusqueda({
  valor = "",
  onChange,
}: {
  valor?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <form role="search" action="/buscar" method="get" className="flex gap-2">
      <input
        type="search"
        name="q"
        defaultValue={valor}
        onChange={onChange}
        aria-label={textos.buscadorEtiqueta}
        placeholder={textos.buscadorAyuda}
        autoComplete="off"
        enterKeyHint="search"
        className="min-h-11 flex-1 rounded-full border border-dorado bg-superficie px-4 text-base text-texto placeholder:text-texto-suave focus:outline-2 focus:outline-dorado"
      />
      <button
        type="submit"
        className="min-h-11 rounded-full bg-boton px-5 font-semibold text-boton-texto"
      >
        {textos.buscadorBoton}
      </button>
    </form>
  );
}
