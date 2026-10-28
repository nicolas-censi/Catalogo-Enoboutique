import Link from "next/link";
import { Suspense } from "react";
import { ConSesion } from "@/components/admin/ConSesion";
import { EditorDestacados } from "@/components/admin/EditorDestacados";
import { EditorSecciones } from "@/components/admin/EditorSecciones";
import { leerDestacados } from "@/lib/admin/destacados";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

const t = textos.admin.destacados;

async function Destacados({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const datos = await leerDestacados(await crearClienteServidor(), id);
  const volver = (
    <Link
      href={datos?.padre ? `/admin/secciones/${datos.padre.id}` : "/admin/secciones"}
      className="inline-flex min-h-11 items-center text-titulo before:mr-1 before:content-['‹']"
    >
      {datos?.padre ? t.volverA(datos.padre.nombre) : t.volver}
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
  const titulo = "mt-8 mb-2 text-lg font-semibold text-destacado";
  return (
    <>
      {volver}
      <h1 className="mt-2 font-titulos text-2xl text-titulo">{datos.seccion.nombre}</h1>
      {/* Un solo nivel: solo las secciones de primer nivel tienen subsecciones (spec 011). */}
      {!datos.padre && (
        <>
          <h2 className={titulo}>{textos.admin.subsecciones}</h2>
          <EditorSecciones secciones={datos.subsecciones} padre={datos.seccion.id} />
        </>
      )}
      {/* Con subsecciones, los destacados son de cada una. */}
      {datos.subsecciones.length === 0 && (
        <>
          <h2 className={titulo}>{t.titulo}</h2>
          <p className="mb-4 max-w-prose text-texto-suave">{t.explicacion}</p>
          <EditorDestacados seccion={datos.seccion} destacados={datos.destacados} />
        </>
      )}
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
