// Spec 009, CA-5: consulta mínima a la base. La llama el cron diario de Vercel para que
// el proyecto gratis de Supabase no se pause por falta de uso.
import { connection } from "next/server";
import { crearClientePublico } from "@/lib/supabase/publico";

export async function GET() {
  // Siempre en el momento (nunca una respuesta guardada de antes).
  await connection();
  const { error } = await crearClientePublico().from("marca").select("id").limit(1);
  return Response.json({ ok: !error }, { status: error ? 503 : 200 });
}
