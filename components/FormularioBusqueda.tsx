import { textos } from "@/lib/textos";

/** Buscador. Funciona sin JavaScript: envía a /buscar?q=... */
export function FormularioBusqueda({ valor = "" }: { valor?: string }) {
  return (
    <form role="search" action="/buscar" method="get" className="flex gap-2">
      <input
        type="search"
        name="q"
        defaultValue={valor}
        aria-label={textos.buscadorEtiqueta}
        placeholder={textos.buscadorAyuda}
        autoComplete="off"
        enterKeyHint="search"
        className="min-h-11 flex-1 rounded-full border border-dorado bg-white px-4 text-base text-negro placeholder:text-negro/60 focus:outline-2 focus:outline-dorado"
      />
      <button
        type="submit"
        className="min-h-11 rounded-full bg-negro px-5 font-semibold text-fondo"
      >
        {textos.buscadorBoton}
      </button>
    </form>
  );
}
