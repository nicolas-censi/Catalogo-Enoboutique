import { Suspense } from "react";
import { ConSesion } from "@/components/admin/ConSesion";
import { EditorPromociones } from "@/components/admin/EditorPromociones";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

const t = textos.admin.promociones;

async function Promociones() {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("promociones").select("id, imagen_path, visible").order("orden");
  if (error) throw error;
  return <EditorPromociones promociones={data.map((p) => ({ id: p.id, imagenPath: p.imagen_path, visible: p.visible }))} />;
}

export default function PaginaPromociones() {
  return (
    <Suspense fallback={null}>
      <ConSesion soloEncargado>
        {() => (
          <>
            <h1 className="font-titulos text-2xl text-titulo">{t.titulo}</h1>
            <p className="mt-2 mb-6 max-w-prose text-texto-suave">{t.ayuda}</p>
            <Promociones />
          </>
        )}
      </ConSesion>
    </Suspense>
  );
}
