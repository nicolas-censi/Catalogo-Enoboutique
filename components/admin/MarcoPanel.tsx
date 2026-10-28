import Link from "next/link";
import type { ReactNode } from "react";
import { salir } from "@/app/admin/acciones-sesion";
import type { SesionPanel } from "@/lib/admin/sesion";
import { textos } from "@/lib/textos";

const enlace = "inline-flex min-h-11 items-center px-3 text-destacado hover:underline";

export function BotonSalir() {
  return (
    <form action={salir}>
      <button type="submit" className="min-h-11 rounded-md border border-dorado/60 px-4 text-texto">
        {textos.admin.salir}
      </button>
    </form>
  );
}

export function MarcoPanel({ sesion, children }: { sesion: SesionPanel; children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-dorado/30">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2">
          <span className="mr-4 font-titulos text-lg text-titulo">{textos.admin.titulo}</span>
          <nav aria-label={textos.admin.titulo} className="flex flex-wrap">
            <Link href="/admin" className={enlace}>{textos.admin.productos}</Link>
            <Link href="/admin/secciones" className={enlace}>{textos.admin.secciones}</Link>
            {sesion.rol === "encargado" && (
              <Link href="/admin/personal" className={enlace}>{textos.admin.personal}</Link>
            )}
            <Link href="/" className={enlace}>{textos.admin.verCarta}</Link>
          </nav>
          <span className="ml-auto text-sm text-texto-suave">{sesion.usuario}</span>
          <BotonSalir />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
