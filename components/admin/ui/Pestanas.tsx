import Link from "next/link";

export type Pestana = { id: string; etiqueta: string };

/**
 * Spec 014, CA-6: pestañas como enlaces (?pestana=…): la elegida queda en la dirección,
 * así Atrás y recargar la mantienen, y anda sin JavaScript.
 */
export function Pestanas({ etiqueta, pestanas, activa, href }: { etiqueta: string; pestanas: Pestana[]; activa: string; href: (id: string) => string }) {
  return (
    <nav aria-label={etiqueta} className="-mx-1 flex gap-6 overflow-x-auto border-b border-linea px-1">
      {pestanas.map((p) => (
        <Link
          key={p.id}
          href={href(p.id)}
          scroll={false}
          aria-current={p.id === activa ? "page" : undefined}
          className={`inline-flex min-h-11 shrink-0 items-center ${
            p.id === activa ? "font-semibold text-texto shadow-[inset_0_-2px_0_var(--color-texto)]" : "text-texto-suave"
          }`}
        >
          {p.etiqueta}
        </Link>
      ))}
    </nav>
  );
}
