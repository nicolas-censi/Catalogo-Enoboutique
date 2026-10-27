// Lecturas de la carta cacheadas en el servidor. Un cambio hecho por fuera del panel
// se ve en la carta en hasta 1 minuto (spec 002, CA-10); uno hecho desde el panel, al
// instante, porque el panel invalida la etiqueta "carta" (spec 004, CA-11).
import { cacheLife, cacheTag } from "next/cache";
import { buscarEnCarta, leerProducto, leerSeccion, leerSecciones } from "@/lib/carta";
import { crearClientePublico } from "@/lib/supabase/publico";

const unMinuto = { stale: 60, revalidate: 60, expire: 3600 };
export const ETIQUETA_CARTA = "carta";

export async function seccionesCarta() {
  "use cache";
  cacheLife(unMinuto);
  cacheTag(ETIQUETA_CARTA);
  return leerSecciones(crearClientePublico());
}

export async function seccionCarta(id: string) {
  "use cache";
  cacheLife(unMinuto);
  cacheTag(ETIQUETA_CARTA);
  return leerSeccion(crearClientePublico(), id);
}

export async function productoCarta(id: string) {
  "use cache";
  cacheLife(unMinuto);
  cacheTag(ETIQUETA_CARTA);
  return leerProducto(crearClientePublico(), id);
}

export async function busquedaCarta(texto: string) {
  "use cache";
  cacheLife(unMinuto);
  cacheTag(ETIQUETA_CARTA);
  return buscarEnCarta(crearClientePublico(), texto);
}
