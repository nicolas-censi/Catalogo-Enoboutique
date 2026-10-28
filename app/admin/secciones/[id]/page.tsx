import Link from "next/link";
import { Suspense } from "react";
import { ConSesion } from "@/components/admin/ConSesion";
import { EditorDestacados } from "@/components/admin/EditorDestacados";
import { leerDestacados } from "@/lib/admin/destacados";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

const t = textos.admin.destacados;

async function Destacados({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const datos = await leerDestacados(await crearClienteServidor(), id);
  const volver = (
    <Link href="/admin/secciones" className="inline-flex min-h-11 items-center text-titulo before:mr-1 before:content-['‹']">
      {t.volver}
    </Link>
  );
  if (!datos) {
    return (
      <>
        {volver}
        <p className="mt-6 text-lg">{t.seccionNoEncontrada}</p>
      </>
    );
  }
  return (
    <>
      {volver}
      <h1 className="mt-2 font-titulos text-2xl text-titulo">{t.titulo(datos.seccion.nombre)}</h1>
      <p className="mt-2 mb-4 max-w-prose text-texto-suave">{t.explicacion}</p>
      <EditorDestacados seccion={datos.seccion} destacados={datos.destacados} />
    </>
  );
}

export default function PaginaDestacados({ params }: PageProps<"/admin/secciones/[id]">) {
  return (
    <Suspense fallback={null}>
      <ConSesion>{() => <Destacados params={params} />}</ConSesion>
    </Suspense>
  );
}
