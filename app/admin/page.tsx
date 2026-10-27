import { Suspense } from "react";
import { ConSesion } from "@/components/admin/ConSesion";
import { textos } from "@/lib/textos";

export default function PaginaPanel() {
  return (
    <Suspense fallback={null}>
      <ConSesion>
        {() => <h1 className="font-titulos text-2xl text-titulo">{textos.admin.productos}</h1>}
      </ConSesion>
    </Suspense>
  );
}
