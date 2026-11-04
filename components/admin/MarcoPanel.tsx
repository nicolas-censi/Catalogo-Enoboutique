import Link from "next/link";
import { salir } from "@/app/admin/acciones-sesion";
import { ActividadIA } from "@/components/admin/ActividadIA";
import { NavPanel } from "@/components/admin/NavPanel";
import { claseBoton } from "@/components/admin/ui/boton";
import { obtenerSesionPanel } from "@/lib/admin/sesion";
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

/**
 * Spec 014 y 015: el menú del panel, en el layout (no se vuelve a armar al navegar).
 * Sin sesión o sin acceso (ingreso, "No tenés acceso"), no hay menú.
 */
export async function MenuPanel() {
  const sesion = await obtenerSesionPanel();
  if (!sesion?.rol) return null;
  const supabase = await crearClienteServidor();
  const { count } = await supabase.from("sugerencias").select("id", { count: "exact", head: true }).eq("estado", "lista");
  return (
    <ActividadIA pendientes={count ?? 0} desde={new Date().toISOString()}>
      <NavPanel esEncargado={sesion.rol === "encargado"} pie={<CuentaPanel usuario={sesion.usuario} />} />
    </ActividadIA>
  );
}
