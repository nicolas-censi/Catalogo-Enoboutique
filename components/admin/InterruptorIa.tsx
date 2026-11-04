"use client";

import { useState, useTransition } from "react";
import { cambiarIa } from "@/app/admin/acciones-sugerencias";
import { textos } from "@/lib/textos";

const t = textos.admin.ia;

/** Spec 007, CA-8: prende o apaga la IA (solo el encargado llega a esta pantalla). */
export function InterruptorIa({ activa }: { activa: boolean }) {
  const [prendida, setPrendida] = useState(activa);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();
  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={prendida}
        aria-label={t.interruptor}
        disabled={ocupado}
        onClick={() =>
          iniciar(async () => {
            const nuevo = !prendida;
            const r = await cambiarIa(nuevo);
            setError(r.error);
            if (!r.error) setPrendida(nuevo);
          })
        }
        className={`inline-flex min-h-11 min-w-32 items-center justify-center rounded-full border px-5 font-semibold disabled:opacity-60 ${
          prendida ? "border-texto bg-texto text-boton-texto" : "border-control text-texto-suave"
        }`}
      >
        {prendida ? t.prendida : t.apagada}
      </button>
      {error && (
        <p role="alert" className="text-error">
          {error}
        </p>
      )}
    </div>
  );
}
