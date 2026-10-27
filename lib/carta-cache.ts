// Lecturas de la carta cacheadas en el servidor. Un cambio del personal se ve en la
// carta en hasta 1 minuto (spec 002, CA-10).
import { cacheLife } from "next/cache";
import { buscarEnCarta, leerProducto, leerSeccion, leerSecciones } from "@/lib/carta";
import { crearClientePublico } from "@/lib/supabase/publico";

const unMinuto = { stale: 60, revalidate: 60, expire: 3600 };

export async function seccionesCarta() {
  "use cache";
  cacheLife(unMinuto);
  return leerSecciones(crearClientePublico());
}

export async function seccionCarta(id: string) {
  "use cache";
  cacheLife(unMinuto);
  return leerSeccion(crearClientePublico(), id);
}

export async function productoCarta(id: string) {
  "use cache";
  cacheLife(unMinuto);
  return leerProducto(crearClientePublico(), id);
}

export async function busquedaCarta(texto: string) {
  "use cache";
  cacheLife(unMinuto);
  return buscarEnCarta(crearClientePublico(), texto);
}
