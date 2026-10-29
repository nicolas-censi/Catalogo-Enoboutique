import Link from "next/link";
import { Suspense } from "react";
import { ConSesion } from "@/components/admin/ConSesion";
import { EditorBodegasTango } from "@/components/admin/EditorBodegasTango";
import { listarBodegasTango } from "@/lib/admin/importacion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

const t = textos.admin.importar;

async function Bodegas() {
  return <EditorBodegasTango bodegas={await listarBodegasTango(await crearClienteServidor())} />;
}

export default function PaginaBodegasTango() {
  return (
    <Suspense fallback={null}>
      <ConSesion soloEncargado>
        {() => (
          <>
            <Link href="/admin/importar" className="inline-flex min-h-11 items-center text-titulo before:mr-1 before:content-['‹']">
              {t.titulo}
            </Link>
            <h1 className="mt-2 font-titulos text-2xl text-titulo">{t.bodegas.titulo}</h1>
            <p className="mt-2 mb-6 max-w-prose text-texto-suave">{t.bodegas.ayuda}</p>
            <Bodegas />
          </>
        )}
      </ConSesion>
    </Suspense>
  );
}
