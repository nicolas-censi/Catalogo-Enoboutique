import Link from "next/link";
import { Suspense } from "react";
import { FormularioElegirContrasena } from "@/components/admin/FormulariosContrasena";
import { obtenerSesionPanel } from "@/lib/admin/sesion";
import { textos } from "@/lib/textos";

async function Contenido() {
  // La sesión la inicia el enlace del mail (ver confirmar/route.ts).
  const sesion = await obtenerSesionPanel();
  if (!sesion) {
    return (
      <>
        <p className="mt-6 text-lg">{textos.admin.enlaceVencido}</p>
        <Link href="/admin/olvide" className="mt-4 inline-flex min-h-11 items-center text-titulo">
          {textos.admin.pedirEnlaceNuevo}
        </Link>
      </>
    );
  }
  return (
    <>
      <p className="mt-2 text-texto-suave">{sesion.email}</p>
      <FormularioElegirContrasena />
    </>
  );
}

export default function PaginaRestablecer() {
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-titulos text-2xl text-titulo">{textos.admin.elegirContrasena}</h1>
      <Suspense fallback={null}>
        <Contenido />
      </Suspense>
    </main>
  );
}
