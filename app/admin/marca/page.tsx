import { Suspense } from "react";
import { ConSesion } from "@/components/admin/ConSesion";
import { EditorMarca } from "@/components/admin/EditorMarca";
import { leerMarca } from "@/lib/carta";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";
import { Cargando } from "@/components/admin/ui/Cargando";

const t = textos.admin.marca;

async function Marca() {
  const { bienvenida, logoPath } = await leerMarca(await crearClienteServidor());
  return <EditorMarca bienvenida={bienvenida} logoPath={logoPath} />;
}

export default function PaginaMarca() {
  return (
    <Suspense fallback={<Cargando />}>
      <ConSesion soloEncargado>
        {() => (
          <>
            <h1 className="font-titulos text-2xl text-titulo">{t.titulo}</h1>
            <p className="mt-2 mb-6 max-w-prose text-texto-suave">{t.ayuda}</p>
            <Marca />
          </>
        )}
      </ConSesion>
    </Suspense>
  );
}
