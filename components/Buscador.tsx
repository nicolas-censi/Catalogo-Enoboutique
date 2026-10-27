"use client";

import { useEffect, useRef, useState } from "react";
import { FormularioBusqueda } from "@/components/FormularioBusqueda";
import { ResultadosBusqueda } from "@/components/ResultadosBusqueda";
import { buscarEnCarta, type Producto } from "@/lib/carta";
import { crearClienteNavegador } from "@/lib/supabase/client";

const ESPERA_MS = 250;

/**
 * Buscador con resultados mientras se escribe. Solo pide al servidor los resultados
 * de la búsqueda, nunca la carta entera (CA-9). Sin JavaScript, el formulario envía
 * a /buscar igual.
 */
export function Buscador() {
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState<{ busqueda: string; productos: Producto[] } | null>(null);
  const ultimaBusqueda = useRef("");

  useEffect(() => {
    const busqueda = texto.trim();
    ultimaBusqueda.current = busqueda;
    if (busqueda.length < 2) return;
    const espera = setTimeout(async () => {
      try {
        const productos = await buscarEnCarta(crearClienteNavegador(), busqueda);
        // Si mientras tanto se siguió escribiendo, esta respuesta ya no sirve.
        if (ultimaBusqueda.current === busqueda) setResultado({ busqueda, productos });
      } catch {
        // Sin conexión: el formulario sigue funcionando con Enter / Buscar.
      }
    }, ESPERA_MS);
    return () => clearTimeout(espera);
  }, [texto]);

  return (
    <>
      <FormularioBusqueda onChange={(evento) => setTexto(evento.target.value)} />
      {/* Solo se muestran los resultados del texto actual (al borrar, desaparecen). */}
      {resultado && resultado.busqueda === texto.trim() && (
        <ResultadosBusqueda busqueda={resultado.busqueda} productos={resultado.productos} />
      )}
    </>
  );
}
