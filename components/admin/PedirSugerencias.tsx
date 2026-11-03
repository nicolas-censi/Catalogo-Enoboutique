"use client";

import { useId, useState, useTransition } from "react";
import { estimarSugerencias, pedirSugerencias } from "@/app/admin/acciones-sugerencias";
import type { Filtros } from "@/lib/admin/productos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.admin.sugerencias;
const secundario = "inline-flex min-h-11 items-center rounded-md border border-dorado/60 px-4 disabled:opacity-60";
const principal = "inline-flex min-h-11 items-center rounded-md bg-boton px-5 font-semibold text-boton-texto disabled:opacity-60";

type Seleccion = { ids: string[] } | { filtros: Filtros };
type Estimado = { cantidad: number; recortados: number; costoUsd: number };

/**
 * Spec 007, CA-2: pide sugerencias para los productos elegidos en la lista. Primero
 * muestra cuántos y cuánto costaría; recién al confirmar los pone en la cola.
 */
export function PedirSugerencias({ seleccion, cantidad, alTerminar }: { seleccion: Seleccion; cantidad: number; alTerminar: () => void }) {
  const id = useId();
  const [incluirCompletos, setIncluirCompletos] = useState(false);
  const [estimado, setEstimado] = useState<Estimado | null>(null);
  const [mensaje, setMensaje] = useState<{ error: string | null; aviso: string | null }>({ error: null, aviso: null });
  const [ocupado, iniciar] = useTransition();

  return (
    <div className="flex basis-full flex-col gap-2 border-t border-dorado/20 pt-3">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={`${id}-completos`} className="inline-flex min-h-11 items-center gap-2">
          <input
            id={`${id}-completos`}
            type="checkbox"
            checked={incluirCompletos}
            onChange={(e) => {
              setIncluirCompletos(e.target.checked);
              setEstimado(null);
            }}
            className="size-5 accent-dorado"
          />
          {t.incluirCompletos}
        </label>
        <button
          type="button"
          disabled={cantidad === 0 || ocupado}
          className={secundario}
          onClick={() =>
            iniciar(async () => {
              setMensaje({ error: null, aviso: null });
              const r = await estimarSugerencias(seleccion, incluirCompletos);
              if (r.error) return setMensaje({ error: r.error, aviso: null });
              setEstimado(r);
            })
          }
        >
          {ocupado && !estimado ? t.calculando : t.sugerir}
        </button>
      </div>
      {estimado && (
        <div role="group" aria-label={t.sugerir} className="flex flex-wrap items-center gap-3">
          <p>
            {t.confirmar(estimado.cantidad, formatearDolares(estimado.costoUsd))}
            {estimado.recortados > 0 && ` ${t.confirmarResto(estimado.recortados)}`}
          </p>
          <button
            type="button"
            disabled={ocupado}
            className={principal}
            onClick={() =>
              iniciar(async () => {
                const r = await pedirSugerencias(seleccion, incluirCompletos);
                setMensaje(r);
                setEstimado(null);
                if (!r.error) alTerminar();
              })
            }
          >
            {ocupado ? t.pidiendo : t.siPedir}
          </button>
          <button type="button" disabled={ocupado} onClick={() => setEstimado(null)} className={secundario}>
            {t.cancelar}
          </button>
        </div>
      )}
      {mensaje.aviso && <p role="status">{mensaje.aviso}</p>}
      {mensaje.error && (
        <p role="alert" className="text-destacado">
          {mensaje.error}
        </p>
      )}
    </div>
  );
}
