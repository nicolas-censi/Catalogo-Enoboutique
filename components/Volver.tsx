import Link from "next/link";
import { textos } from "@/lib/textos";

/** "‹ La carta" (spec 013). El nombre accesible empieza igual que el texto visible. */
export function Volver({ href = "/", texto = textos.laCarta, etiqueta = textos.volverACarta }: { href?: string; texto?: string; etiqueta?: string }) {
  return (
    <Link
      href={href}
      aria-label={etiqueta}
      className="tocable -ml-1 inline-flex min-h-11 items-center gap-1 px-1 text-sm text-titulo"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="m15 6-6 6 6 6" />
      </svg>
      {texto}
    </Link>
  );
}
