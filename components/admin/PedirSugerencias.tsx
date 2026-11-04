"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { estimarSugerencias, pedirSugerencias } from "@/app/admin/acciones-sugerencias";
import { claseBoton } from "@/components/admin/ui/boton";
import type { Filtros } from "@/lib/admin/productos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.admin.sugerencias;

type Seleccion = { ids: string[] } | { filtros: Filtros };
type Estimado = { cantidad: number; recortados: number; costoUsd: number };

/**
 * Spec 007, CA-2 (con el diseño de la spec 014): al abrirse calcula cuántos se van a
 * pedir y cuánto costaría; recién al confirmar los pone en la cola.
 */
export function PedirSugerencias({ seleccion, alTerminar, alCancelar }: { seleccion: Seleccion; alTerminar: (aviso: string) => void; alCancelar: () => void }) {
  const id = useId();
  const [incluirCompletos, setIncluirCompletos] = useState(false);
  const [estimado, setEstimado] = useState<Estimado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();
  const clave = JSON.stringify(seleccion);

  useEffect(() => {
    let vigente = true;
    iniciar(async () => {
      setEstimado(null);
      setError(null);
      const r = await estimarSugerencias(JSON.parse(clave) as Seleccion, incluirCompletos);
      if (!vigente) return;
      if (r.error) setError(r.error);
      else setEstimado(r);
    });
    return () => {
      vigente = false;
    };
  }, [clave, incluirCompletos]);

  return (
    <div className="flex flex-col gap-4">
      <label htmlFor={`${id}-completos`} className="inline-flex min-h-11 items-center gap-3">
        <input id={`${id}-completos`} type="checkbox" checked={incluirCompletos} onChange={(e) => setIncluirCompletos(e.target.checked)} className="size-5 accent-texto" />
        {t.incluirCompletos}
      </label>
      <p role="status" className="min-h-6">
        {estimado
          ? `${t.confirmar(estimado.cantidad, formatearDolares(estimado.costoUsd))}${estimado.recortados > 0 ? ` ${t.confirmarResto(estimado.recortados)}` : ""}`
          : !error && t.calculando}
      </p>
      {error && (
        <p role="alert" className="text-error">
          {error}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" onClick={alCancelar} className={claseBoton("secundario")}>
          {t.cancelar}
        </button>
        <button
          type="button"
          disabled={!estimado || ocupado}
          className={claseBoton("principal")}
          onClick={() =>
            iniciar(async () => {
              const r = await pedirSugerencias(seleccion, incluirCompletos);
              if (r.error) setError(r.error);
              else alTerminar(r.aviso ?? "");
            })
          }
        >
          {ocupado && estimado ? t.pidiendo : t.siPedir}
        </button>
      </div>
    </div>
  );
}
