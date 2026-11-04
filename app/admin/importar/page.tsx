import Link from "next/link";
import { Suspense } from "react";
import { ConSesion } from "@/components/admin/ConSesion";
import { ImportarTango } from "@/components/admin/ImportarTango";
import { textos } from "@/lib/textos";
import { Cargando } from "@/components/admin/ui/Cargando";

const t = textos.admin.importar;

export default function PaginaImportar() {
  return (
    <Suspense fallback={<Cargando />}>
      <ConSesion soloEncargado>
        {() => (
          <>
            <h1 className="font-titulos text-2xl text-titulo">{t.titulo}</h1>
            <p className="mt-2 mb-6 max-w-prose text-texto-suave">{t.ayuda}</p>
            <ImportarTango />
            <h2 className="mt-10 mb-2 text-lg font-semibold text-destacado">{t.ajustes}</h2>
            <ul className="flex flex-wrap gap-x-6">
              <li>
                <Link href="/admin/importar/abreviaturas" className="inline-flex min-h-11 items-center underline underline-offset-4">
                  {t.abreviaturas.titulo}
                </Link>
              </li>
              <li>
                <Link href="/admin/importar/bodegas" className="inline-flex min-h-11 items-center underline underline-offset-4">
                  {t.bodegas.titulo}
                </Link>
              </li>
            </ul>
          </>
        )}
      </ConSesion>
    </Suspense>
  );
}
