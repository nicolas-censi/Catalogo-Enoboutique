// Spec 015, CA-4: cómo están las sugerencias, para el aviso y el contador del panel.
import { obtenerSesionPanel } from "@/lib/admin/sesion";
import { iaActiva } from "@/lib/ia/ajustes";
import { crearClienteServidor } from "@/lib/supabase/server";

export async function GET(pedido: Request) {
  // El corte se toma antes de consultar: lo que termine mientras tanto entra en la
  // próxima consulta (y el panel descarta los repetidos).
  const ahora = new Date().toISOString();
  const sesion = await obtenerSesionPanel();
  if (!sesion?.rol) return Response.json({ error: "No autorizado." }, { status: 401 });
  const supabase = await crearClienteServidor();
  const desde = new URL(pedido.url).searchParams.get("desde");
  const valido = desde && !Number.isNaN(Date.parse(desde)) ? new Date(desde).toISOString() : null;
  const cuenta = (estado: "lista" | "en_cola" | "procesando") =>
    supabase.from("sugerencias").select("id", { count: "exact", head: true }).eq("estado", estado);
  const [listas, enCola, procesando, activa, nuevas] = await Promise.all([
    cuenta("lista"),
    cuenta("en_cola"),
    cuenta("procesando"),
    iaActiva(supabase),
    valido
      ? supabase
          .from("sugerencias")
          .select("id, estado, producto_id, procesada_en, productos(nombre)")
          .in("estado", ["lista", "fallo"])
          .gt("procesada_en", valido)
          .order("procesada_en")
          .limit(20)
      : Promise.resolve({ data: [] }),
  ]);
  return Response.json({
    ahora,
    listas: listas.count ?? 0,
    enCola: enCola.count ?? 0,
    procesando: procesando.count ?? 0,
    iaActiva: activa,
    nuevas: (nuevas.data ?? []).map((s) => ({
      id: s.id,
      estado: s.estado,
      productoId: s.producto_id,
      producto: (s.productos as { nombre: string } | null)?.nombre ?? "",
      procesadaEn: s.procesada_en,
    })),
  });
}
