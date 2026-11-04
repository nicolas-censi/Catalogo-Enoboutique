"use client";

import { useOptimistic, useState, useTransition } from "react";
import { cambiarVisibleProducto } from "@/app/admin/acciones-producto";
import { textos } from "@/lib/textos";

/** Spec 014, CA-6: "Visible en la carta" arriba de la ficha; cambia al instante. */
export function InterruptorVisible({ productoId, visible }: { productoId: string; visible: boolean }) {
  const [guardado, setGuardado] = useState(visible);
  const [actual, setActual] = useOptimistic(guardado);
  const [error, setError] = useState<string | null>(null);
  const [, iniciar] = useTransition();
  return (
    <span className="inline-flex flex-wrap items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={actual}
        onClick={() =>
          iniciar(async () => {
            const nuevo = !actual;
            setError(null);
            setActual(nuevo);
            const r = await cambiarVisibleProducto(productoId, nuevo);
            if (r.error) setError(r.error);
            else setGuardado(nuevo);
          })
        }
        className="inline-flex min-h-11 items-center gap-3"
      >
        <span aria-hidden="true" className={`relative h-6 w-10 rounded-full transition-colors ${actual ? "bg-texto" : "bg-linea"}`}>
          <span className={`absolute top-0.5 size-5 rounded-full bg-superficie shadow transition-[left] ${actual ? "left-[1.125rem]" : "left-0.5"}`} />
        </span>
        {textos.admin.visibleEnCarta}
      </button>
      {error && (
        <span role="alert" className="text-sm text-error">
          {error}
        </span>
      )}
    </span>
  );
}
