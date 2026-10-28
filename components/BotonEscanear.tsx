import Link from "next/link";
import { textos } from "@/lib/textos";

/** Ícono de escáner: esquinas de encuadre con barras de un código adentro. */
function IconoEscaner() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
      <path d="M7 8v8M10 8v8M12.5 8v8M15 8v8M17 8v8" />
    </svg>
  );
}

/** Botón circular del inicio que abre el escáner de códigos de barras. */
export function BotonEscanear() {
  return (
    <Link
      href="/escanear"
      aria-label={textos.escaner.boton}
      title={textos.escaner.boton}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-dorado text-destacado hover:bg-superficie focus:outline-2 focus:outline-dorado"
    >
      <IconoEscaner />
    </Link>
  );
}
