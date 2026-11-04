"use client";

import { useState, type ReactNode } from "react";
import { claseBoton } from "@/components/admin/ui/boton";
import { textos } from "@/lib/textos";

/**
 * Spec 014, CA-6: en la ficha, la sugerencia lista de la IA aparece como un aviso; con
 * Revisar se despliega la revisión (spec 007) sin salir de la ficha. Recién pedida
 * (?revisar=1), ya se ve desplegada.
 */
export function AvisoSugerencia({ texto, abiertaAlInicio = false, children }: { texto: string; abiertaAlInicio?: boolean; children: ReactNode }) {
  const [abierta, setAbierta] = useState(abiertaAlInicio);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-linea border-l-4 border-l-dorado bg-superficie px-4 py-2">
        <p>{texto}</p>
        <button type="button" aria-expanded={abierta} onClick={() => setAbierta((a) => !a)} className={claseBoton("secundario")}>
          {abierta ? textos.admin.sugerencias.ocultar : textos.admin.sugerencias.revisar}
        </button>
      </div>
      {abierta && children}
    </div>
  );
}
