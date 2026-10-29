import Link from "next/link";
import { Suspense } from "react";
import { ConSesion } from "@/components/admin/ConSesion";
import { EditorAbreviaturas } from "@/components/admin/EditorAbreviaturas";
import { leerDiccionario } from "@/lib/admin/importacion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

const t = textos.admin.importar;

async function Abreviaturas() {
  return <EditorAbreviaturas abreviaturas={await leerDiccionario(await crearClienteServidor())} />;
}

export default function PaginaAbreviaturas() {
  return (
    <Suspense fallback={null}>
      <ConSesion soloEncargado>
        {() => (
          <>
            <Link href="/admin/importar" className="inline-flex min-h-11 items-center text-titulo before:mr-1 before:content-['‹']">
              {t.titulo}
            </Link>
            <h1 className="mt-2 font-titulos text-2xl text-titulo">{t.abreviaturas.titulo}</h1>
            <p className="mt-2 mb-6 max-w-prose text-texto-suave">{t.abreviaturas.ayuda}</p>
            <Abreviaturas />
          </>
        )}
      </ConSesion>
    </Suspense>
  );
}
