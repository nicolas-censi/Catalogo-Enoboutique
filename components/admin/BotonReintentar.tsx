"use client";

import { useState, useTransition } from "react";
import { reintentarFallidas } from "@/app/admin/acciones-sugerencias";
import { textos } from "@/lib/textos";

/** Spec 007, CA-3: vuelve a pedir las sugerencias que fallaron. */
export function BotonReintentar() {
  const [mensaje, setMensaje] = useState<{ error: string | null; aviso: string | null }>({ error: null, aviso: null });
  const [ocupado, iniciar] = useTransition();
  return (
    <>
      <button
        type="button"
        disabled={ocupado}
        onClick={() => iniciar(async () => setMensaje(await reintentarFallidas()))}
        className="inline-flex min-h-11 items-center rounded-md border border-dorado/60 px-4 disabled:opacity-60"
      >
        {textos.admin.paraRevisar.reintentar}
      </button>
      {mensaje.aviso && <p role="status">{mensaje.aviso}</p>}
      {mensaje.error && (
        <p role="alert" className="text-destacado">
          {mensaje.error}
        </p>
      )}
    </>
  );
}
