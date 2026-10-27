import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { BotonSalir, MarcoPanel } from "@/components/admin/MarcoPanel";
import { obtenerSesionPanel, type SesionPanel } from "@/lib/admin/sesion";
import { textos } from "@/lib/textos";

/**
 * Protege una pantalla del panel: sin sesión manda a ingresar; si no es del personal
 * muestra "No tenés acceso". Se usa dentro de <Suspense> (lee cookies).
 */
export async function ConSesion({
  children,
  soloEncargado = false,
}: {
  children: (sesion: SesionPanel) => ReactNode;
  soloEncargado?: boolean;
}) {
  const sesion = await obtenerSesionPanel();
  if (!sesion) redirect("/admin/ingresar");
  if (!sesion.rol || (soloEncargado && sesion.rol !== "encargado")) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-lg">{textos.admin.sinAcceso}</p>
        <p className="mt-1 text-texto-suave">{textos.admin.sinAccesoAyuda}</p>
        <div className="mt-6 flex justify-center">
          <BotonSalir />
        </div>
      </main>
    );
  }
  return <MarcoPanel sesion={sesion}>{children(sesion)}</MarcoPanel>;
}
