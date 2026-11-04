// Spec 015, CA-3: procesa una tanda de la cola para el panel abierto (sesión del
// personal). Es una ruta y no una Server Action: las acciones se ejecutan de a una y la
// cola dejaría esperando al resto del panel.
import { obtenerSesionPanel } from "@/lib/admin/sesion";
import { procesarTanda } from "@/lib/ia/cola-servidor";
import { crearClienteServidor } from "@/lib/supabase/server";

export const maxDuration = 300;

export async function POST() {
  const sesion = await obtenerSesionPanel();
  if (!sesion?.rol) return Response.json({ error: "No autorizado." }, { status: 401 });
  try {
    return Response.json(await procesarTanda(await crearClienteServidor()));
  } catch {
    return Response.json({ error: "No se pudo seguir con la cola." }, { status: 500 });
  }
}
