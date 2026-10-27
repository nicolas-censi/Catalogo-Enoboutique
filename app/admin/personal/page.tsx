import { Suspense } from "react";
import { ConSesion } from "@/components/admin/ConSesion";
import { EditorPersonal, type Persona } from "@/components/admin/EditorPersonal";
import { cuentas } from "@/lib/admin/personal-servidor";
import type { Rol, SesionPanel } from "@/lib/admin/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

async function Personal({ sesion }: { sesion: SesionPanel }) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("personal").select("user_id, rol").order("creado_en");
  if (error) throw error;
  const datos = await cuentas(data.map((p) => p.user_id));
  const personas: Persona[] = data.map((p) => ({
    id: p.user_id,
    email: datos.get(p.user_id)?.email ?? "",
    rol: p.rol as Rol,
    activa: datos.get(p.user_id)?.activa ?? false,
    soyYo: p.user_id === sesion.id,
  }));
  return <EditorPersonal personas={personas} />;
}

export default function PaginaPersonal() {
  return (
    <Suspense fallback={null}>
      <ConSesion soloEncargado>
        {(sesion) => (
          <>
            <h1 className="mb-4 font-titulos text-2xl text-titulo">{textos.admin.personal}</h1>
            <Personal sesion={sesion} />
          </>
        )}
      </ConSesion>
    </Suspense>
  );
}
