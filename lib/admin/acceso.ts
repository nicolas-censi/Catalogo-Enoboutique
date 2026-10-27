import "server-only";
import { obtenerSesionPanel, type SesionPanel } from "@/lib/admin/sesion";

/** Para Server Actions: corta si quien llama no es del personal. */
export async function exigirPersonal(): Promise<SesionPanel> {
  const sesion = await obtenerSesionPanel();
  if (!sesion?.rol) throw new Error("No tenés acceso al panel.");
  return sesion;
}
