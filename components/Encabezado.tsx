import Link from "next/link";
import { LogoMarca } from "@/components/LogoMarca";

/**
 * Encabezado de la carta (spec 013): en el inicio, el logo grande con una línea dorada
 * debajo; en el resto de las páginas, el logo chico.
 */
export function Encabezado({ grande = false }: { grande?: boolean }) {
  const clase = grande ? "h-20 w-auto" : "h-9 w-auto";
  return (
    <header className={`flex flex-col items-center px-4 ${grande ? "pt-12" : "pt-5 pb-1"}`}>
      <Link href="/" className="tocable inline-block min-h-11 max-w-full">
        <LogoMarca clase={clase} />
      </Link>
      {grande && <span aria-hidden="true" className="mt-5 mb-4 h-px w-10 bg-dorado" />}
    </header>
  );
}
