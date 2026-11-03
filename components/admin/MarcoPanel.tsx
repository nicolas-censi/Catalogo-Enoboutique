import Link from "next/link";
import type { ReactNode } from "react";
import { salir } from "@/app/admin/acciones-sesion";
import { NavPanel } from "@/components/admin/NavPanel";
import { claseBoton } from "@/components/admin/ui/boton";
import type { SesionPanel } from "@/lib/admin/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

export function BotonSalir({ variante = "secundario" }: { variante?: "secundario" | "texto" }) {
  return (
    <form action={salir}>
      <button type="submit" className={claseBoton(variante)}>
        {textos.admin.salir}
      </button>
    </form>
  );
}

/** Ver la carta, usuario y Salir: al pie del menú (computadora) y en Ajustes/Cuenta. */
export function CuentaPanel({ usuario }: { usuario: string }) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <Link href="/" className={claseBoton("texto", "justify-start px-3")}>
        {textos.admin.verCarta}
        <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 17 17 7M9 7h8v8" />
        </svg>
      </Link>
      <div className="flex items-center justify-between gap-2 pl-3">
        <span className="truncate text-texto-suave">{usuario}</span>
        <BotonSalir variante="texto" />
      </div>
    </div>
  );
}

/** Spec 014, CA-1 y CA-2: el marco del panel, con su tema claro y el menú nuevo. */
export async function MarcoPanel({ sesion, children }: { sesion: SesionPanel; children: ReactNode }) {
  const supabase = await crearClienteServidor();
  const { count } = await supabase.from("sugerencias").select("id", { count: "exact", head: true }).eq("estado", "lista");
  return (
    <div className="tema-panel min-h-dvh md:flex">
      <NavPanel esEncargado={sesion.rol === "encargado"} pendientes={count ?? 0} pie={<CuentaPanel usuario={sesion.usuario} />} />
      <main className="mx-auto w-full max-w-6xl min-w-0 flex-1 px-4 pt-6 pb-28 md:px-10 md:pt-10 md:pb-12">{children}</main>
    </div>
  );
}
