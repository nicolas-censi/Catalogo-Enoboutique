import { Suspense } from "react";
import { ConSesion } from "@/components/admin/ConSesion";
import { EditorSecciones } from "@/components/admin/EditorSecciones";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

async function Secciones() {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("secciones").select("id, nombre, visible, productos(count)").order("orden");
  if (error) throw error;
  const secciones = data.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    visible: s.visible,
    productos: (s.productos as unknown as { count: number }[])[0]?.count ?? 0,
  }));
  return <EditorSecciones secciones={secciones} />;
}

export default function PaginaSecciones() {
  return (
    <Suspense fallback={null}>
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
