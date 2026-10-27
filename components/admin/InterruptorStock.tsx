"use client";

import { useOptimistic, useState, useTransition } from "react";
import { cambiarStock } from "@/app/admin/acciones-stock";
import { textos } from "@/lib/textos";

/** "Disponible / Sin stock" con un toque: cambia al instante y vuelve atrás si falla. */
export function InterruptorStock({ anadaId, etiqueta, enStock }: { anadaId: string; etiqueta: string; enStock: boolean }) {
  const [guardado, setGuardado] = useState(enStock);
  const [visible, setVisible] = useOptimistic(guardado);
  const [error, setError] = useState<string | null>(null);
  const [, iniciar] = useTransition();

  function alternar() {
    const nuevo = !visible;
    setError(null);
    iniciar(async () => {
      setVisible(nuevo);
      const resultado = await cambiarStock(anadaId, nuevo);
      if (resultado.error) setError(resultado.error);
      else setGuardado(nuevo);
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={visible}
        aria-label={textos.admin.stockDe(etiqueta)}
        onClick={alternar}
        className={`inline-flex min-h-11 min-w-32 items-center justify-center rounded-full border px-4 font-semibold ${
          visible ? "border-dorado bg-dorado text-boton-texto" : "border-dorado/60 text-texto-suave"
        }`}
      >
        {visible ? textos.admin.disponible : textos.admin.sinStock}
      </button>
      {error && (
        <span role="alert" className="text-sm text-destacado">
          {error}
        </span>
      )}
    </span>
  );
}
