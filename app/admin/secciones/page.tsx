import { Suspense } from "react";
import { ConSesion } from "@/components/admin/ConSesion";
import { EditorSecciones } from "@/components/admin/EditorSecciones";
import { listarSeccionesPanel } from "@/lib/admin/secciones";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";
import { Cargando } from "@/components/admin/ui/Cargando";

async function Secciones() {
  return <EditorSecciones secciones={await listarSeccionesPanel(await crearClienteServidor(), null)} />;
}

export default function PaginaSecciones() {
  return (
    <Suspense fallback={<Cargando />}>
      <ConSesion>
        {() => (
          <>
            <h1 className="mb-4 font-titulos text-2xl text-titulo">{textos.admin.secciones}</h1>
            <Secciones />
          </>
        )}
      </ConSesion>
    </Suspense>
  );
}
