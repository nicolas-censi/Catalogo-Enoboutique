"use client";

import { useEffect, useRef } from "react";
import { claseBoton } from "@/components/admin/ui/boton";
import { textos } from "@/lib/textos";

/**
 * Spec 014, CA-3: confirmación de una acción que borra o da de baja (<dialog> modal: foco
 * atrapado y Escape para cancelar).
 */
export function Confirmar({
  abierto,
  titulo,
  detalle,
  confirmar,
  ocupado = false,
  error = null,
  alConfirmar,
  alCancelar,
}: {
  abierto: boolean;
  titulo: string;
  detalle?: string;
  confirmar: string;
  ocupado?: boolean;
  error?: string | null;
  alConfirmar: () => void;
  alCancelar: () => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  return (
    <dialog
      ref={dialogo}
      aria-label={titulo}
      onCancel={(e) => {
        e.preventDefault();
        alCancelar();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-linea bg-superficie p-6 text-texto backdrop:bg-texto/40"
    >
      <h2 className="font-titulos text-lg">{titulo}</h2>
      {detalle && <p className="mt-2 text-texto-suave">{detalle}</p>}
      {error && (
        <p role="alert" className="mt-3 text-error">
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" onClick={alCancelar} className={claseBoton("secundario")}>
          {textos.admin.ui.cancelar}
        </button>
        <button type="button" disabled={ocupado} onClick={alConfirmar} className={claseBoton("peligro")}>
          {confirmar}
        </button>
      </div>
    </dialog>
  );
}
