"use client";

import { useState, useTransition } from "react";
import { pedirSugerencia } from "@/app/admin/acciones-sugerencias";
import { textos } from "@/lib/textos";

const t = textos.admin.sugerencias;

/** Spec 007, CA-1: pide una sugerencia para este producto y espera el resultado. */
export function BotonSugerir({ productoId }: { productoId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [buscando, iniciar] = useTransition();
  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={buscando}
        onClick={() =>
          iniciar(async () => {
            setError(null);
            setError((await pedirSugerencia(productoId)).error);
          })
        }
        className="inline-flex min-h-11 items-center gap-2 rounded-md border border-dorado/60 px-4 disabled:opacity-60"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" />
        </svg>
        {t.sugerir}
      </button>
      {buscando && (
        <p role="status" className="text-sm text-texto-suave">
          {t.buscando}
        </p>
      )}
      {error && (
        <p role="alert" className="text-destacado">
          {error}
        </p>
      )}
    </div>
  );
}
