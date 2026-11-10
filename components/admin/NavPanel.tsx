"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { usePendientes } from "@/components/admin/ActividadIA";
import { textos } from "@/lib/textos";

const t = textos.admin.nav;

const iconos = {
  productos: <path d="M8 3h8l-1 7a3 3 0 0 1-6 0zM12 13v8M8 21h8" />,
  secciones: <path d="M4 6h16M4 12h16M4 18h10" />,
  revisar: <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" />,
  ajustes: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />
    </>
  ),
};

type Item = { href: string; etiqueta: string; corta: string; icono: keyof typeof iconos; activo: (ruta: string) => boolean; aviso?: number };

/**
 * Spec 014, CA-1: en la computadora, columna a la izquierda; en el celular, barra fija
 * abajo. Una sola navegación ("Panel"), marcada en la opción actual.
 */
export function NavPanel({ esEncargado, marca, pie }: { esEncargado: boolean; marca: ReactNode; pie: ReactNode }) {
  // Spec 015, CA-4: el contador se actualiza solo (ActividadIA).
  const pendientes = usePendientes();
  const ruta = usePathname();
  // Spec 015, CA-2: la opción tocada se marca al instante, antes de que llegue la pantalla.
  const [tocada, setTocada] = useState<{ href: string; desde: string } | null>(null);
  const pendiente = tocada && tocada.desde === ruta ? tocada.href : null;
  const items: Item[] = [
    { href: "/admin", etiqueta: textos.admin.productos, corta: textos.admin.productos, icono: "productos", activo: (r) => r === "/admin" || r.startsWith("/admin/productos") },
    { href: "/admin/secciones", etiqueta: textos.admin.secciones, corta: textos.admin.secciones, icono: "secciones", activo: (r) => r.startsWith("/admin/secciones") },
    { href: "/admin/sugerencias", etiqueta: t.paraRevisar, corta: t.paraRevisarCorto, icono: "revisar", activo: (r) => r.startsWith("/admin/sugerencias"), aviso: pendientes },
    {
      href: "/admin/ajustes",
      etiqueta: esEncargado ? t.ajustes : t.cuenta,
      corta: esEncargado ? t.ajustes : t.cuenta,
      icono: "ajustes",
      activo: (r) => ["/admin/ajustes", "/admin/importar", "/admin/promociones", "/admin/marca", "/admin/ia", "/admin/personal", "/admin/qr"].some((p) => r.startsWith(p)),
    },
  ];

  return (
    <nav
      aria-label={textos.admin.titulo}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-linea bg-superficie pb-[env(safe-area-inset-bottom)] md:sticky md:top-0 md:flex md:h-dvh md:w-60 md:shrink-0 md:flex-col md:border-t-0 md:border-r md:bg-fondo md:p-4"
    >
      {/* Spec 017: el logo de la marca, solo en la computadora. */}
      <div className="hidden px-3 pt-2 pb-8 md:block">{marca}</div>
      <ul className="flex md:flex-col md:gap-1">
        {items.map((item) => {
          const activo = pendiente ? pendiente === item.href : item.activo(ruta);
          return (
            <li key={item.href} className="flex-1 md:flex-none">
              <Link
                href={item.href}
                aria-current={item.activo(ruta) ? "page" : undefined}
                onClick={() => setTocada({ href: item.href, desde: ruta })}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs md:min-h-11 md:flex-row md:justify-start md:gap-3 md:rounded-lg md:px-3 md:text-base ${
                  activo ? "font-semibold text-texto md:bg-superficie md:shadow-[inset_3px_0_0_var(--color-dorado)]" : "text-texto-suave md:text-texto"
                }`}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {iconos[item.icono]}
                </svg>
                <span className="md:hidden">{item.corta}</span>
                <span className="hidden md:inline">{item.etiqueta}</span>
                {item.aviso ? (
                  <>
                    <span aria-hidden="true" className="absolute top-1.5 ml-7 min-w-5 rounded-full bg-texto px-1.5 text-center text-[0.6875rem] leading-5 font-semibold text-fondo md:static md:ml-auto md:bg-transparent md:px-0 md:text-sm md:text-dorado-texto">
                      {item.aviso}
                    </span>
                    <span className="sr-only">{` (${item.aviso})`}</span>
                  </>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto hidden border-t border-linea pt-3 md:block">{pie}</div>
    </nav>
  );
}
