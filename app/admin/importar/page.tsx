import { Suspense } from "react";
import { ConSesion } from "@/components/admin/ConSesion";
import { ImportarTango } from "@/components/admin/ImportarTango";
import { textos } from "@/lib/textos";

const t = textos.admin.importar;

export default function PaginaImportar() {
  return (
    <Suspense fallback={null}>
      <ConSesion soloEncargado>
        {() => (
          <>
            <h1 className="font-titulos text-2xl text-titulo">{t.titulo}</h1>
            <p className="mt-2 mb-6 max-w-prose text-texto-suave">{t.ayuda}</p>
            <ImportarTango />
          </>
        )}
      </ConSesion>
    </Suspense>
  );
}
