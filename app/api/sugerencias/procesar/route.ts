// Spec 007, T7: procesa la cola de sugerencias desde un cron del hosting (por ejemplo,
// Vercel Cron, que manda "Authorization: Bearer <CRON_SECRET>"). Sin CRON_SECRET
// configurado, la ruta no hace nada.
import { timingSafeEqual } from "node:crypto";
import { procesarTanda } from "@/lib/ia/cola-servidor";
import { clienteServicio } from "@/lib/supabase/servicio";

export const maxDuration = 300;
const HASTA_MS = 240_000;

function autorizado(pedido: Request): boolean {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) return false;
  const esperado = Buffer.from(`Bearer ${secreto}`);
  const recibido = Buffer.from(pedido.headers.get("authorization") ?? "");
  return recibido.length === esperado.length && timingSafeEqual(recibido, esperado);
}

export async function GET(pedido: Request) {
  if (!autorizado(pedido)) return Response.json({ error: "No autorizado." }, { status: 401 });
  const cliente = clienteServicio();
  const inicio = Date.now();
  let listas = 0;
  let fallidas = 0;
  for (;;) {
    const r = await procesarTanda(cliente);
    listas += r.listas;
    fallidas += r.fallidas;
    const motivo = r.apagada ? "apagada" : r.topeAlcanzado ? "tope" : r.quedan === 0 ? "vacia" : null;
    if (motivo || Date.now() - inicio > HASTA_MS) return Response.json({ listas, fallidas, quedan: r.quedan, motivo: motivo ?? "tiempo" });
  }
}
