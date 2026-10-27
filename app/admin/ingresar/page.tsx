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
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-titulos text-2xl text-titulo">{textos.admin.ingresar}</h1>
      <Suspense fallback={null}>
        <SiYaIngreso />
      </Suspense>
      <FormularioIngreso />
    </main>
  );
}
