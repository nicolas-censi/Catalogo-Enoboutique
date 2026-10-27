// Lecturas de la carta cacheadas en el servidor. Un cambio del personal se ve en la
// carta en hasta 1 minuto (spec 002, CA-10).
import { cacheLife } from "next/cache";
import { leerSecciones } from "@/lib/carta";
import { crearClientePublico } from "@/lib/supabase/publico";

const unMinuto = { stale: 60, revalidate: 60, expire: 3600 };

export async function seccionesCarta() {
  "use cache";
  cacheLife(unMinuto);
  return leerSecciones(crearClientePublico());
}
