"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Ventana modal simple (<dialog>): foco atrapado, Escape cierra. */
export function Dialogo({ abierto, titulo, alCerrar, children }: { abierto: boolean; titulo: string; alCerrar: () => void; children: ReactNode }) {
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
        alCerrar();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-linea bg-superficie p-6 text-texto backdrop:bg-texto/40"
    >
      <h2 className="mb-4 font-titulos text-lg">{titulo}</h2>
      {abierto && children}
    </dialog>
  );
}
