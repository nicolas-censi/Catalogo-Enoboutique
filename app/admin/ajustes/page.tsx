import Link from "next/link";
import { Suspense } from "react";
import { ConSesion } from "@/components/admin/ConSesion";
import { CuentaPanel } from "@/components/admin/MarcoPanel";
import { textos } from "@/lib/textos";
import { Cargando } from "@/components/admin/ui/Cargando";

const t = textos.admin.ajustes;

/** Spec 014, CA-1: lo que se usa de vez en cuando (encargado) y la cuenta (todos). */
export default function PaginaAjustes() {
  return (
    <Suspense fallback={<Cargando />}>
      <ConSesion>
        {(sesion) => {
          const esEncargado = sesion.rol === "encargado";
          return (
            <>
              <h1 className="font-titulos text-2xl">{esEncargado ? t.titulo : t.tituloVendedor}</h1>
              {esEncargado && (
                <>
                  <p className="mt-2 text-texto-suave">{t.ayuda}</p>
                  <ul className="mt-6 divide-y divide-linea rounded-xl border border-linea bg-superficie">
                    {t.opciones.map((o) => (
                      <li key={o.href}>
                        <Link href={o.href} className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 hover:bg-fondo">
                          <span>
                            <span className="block font-semibold">{o.titulo}</span>
                            <span className="block text-sm text-texto-suave">{o.detalle}</span>
                          </span>
                          <span aria-hidden="true" className="text-texto-suave">
                            ›
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <section aria-label={t.tituloVendedor} className="mt-8 max-w-sm md:hidden rounded-xl border border-linea bg-superficie p-3">
                <p className="px-3 pb-2 text-sm text-texto-suave">{t.sesion(sesion.usuario)}</p>
                <CuentaPanel usuario={sesion.usuario} />
              </section>
            </>
          );
        }}
      </ConSesion>
    </Suspense>
  );
}
