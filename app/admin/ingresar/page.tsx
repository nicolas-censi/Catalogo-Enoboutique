import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FormularioIngreso } from "@/components/admin/FormularioIngreso";
import { obtenerSesionPanel } from "@/lib/admin/sesion";
import { textos } from "@/lib/textos";

async function SiYaIngreso() {
  const sesion = await obtenerSesionPanel();
  if (sesion?.rol) redirect("/admin");
  return null;
}

export default function PaginaIngresar() {
  return (
    <div className="flex min-h-[70dvh] items-start justify-center py-8 md:items-center">
      <div className="w-full max-w-sm rounded-xl border border-linea bg-superficie p-6 md:p-8">
        <h1 className="font-titulos text-2xl">{textos.admin.ingresar}</h1>
        <Suspense fallback={null}>
          <SiYaIngreso />
        </Suspense>
        <FormularioIngreso />
      </div>
    </div>
  );
}
