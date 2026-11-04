import Link from "next/link";
import type { ReactNode } from "react";

/** Spec 014, CA-4: filtro de un toque. Es un enlace: anda sin JavaScript. */
export function Chip({ href, activo, children }: { href: string; activo: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={activo ? "true" : undefined}
      className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm ${
        activo ? "border-texto bg-texto text-fondo" : "border-linea bg-superficie text-texto"
      }`}
    >
      {children}
    </Link>
  );
}
