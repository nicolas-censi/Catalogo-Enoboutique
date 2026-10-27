"use client";

import { useRef, useState, useTransition } from "react";
import { borrarProducto } from "@/app/admin/acciones-producto";
import { textos } from "@/lib/textos";

const t = textos.admin;
const boton = "inline-flex min-h-11 items-center rounded-md border border-dorado/60 px-4";

/** Botón "Borrar producto" con un diálogo de confirmación accesible (<dialog>). */
export function BorrarProducto({ productoId, nombre, anadas }: { productoId: string; nombre: string; anadas: number }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [borrando, iniciar] = useTransition();

  return (
    <>
      <button type="button" onClick={() => dialogo.current?.showModal()} className={boton}>
        {t.borrarProducto}
      </button>
      <dialog
        ref={dialogo}
        aria-labelledby="titulo-borrar"
        className="m-auto max-w-md rounded-lg border border-dorado/60 bg-superficie p-6 text-texto backdrop:bg-fondo/80"
      >
        <p id="titulo-borrar" className="text-lg">
          {t.confirmarBorrarProducto(nombre, anadas)}
        </p>
        {error && (
          <p role="alert" className="mt-2 text-destacado">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => dialogo.current?.close()} className={boton} autoFocus>
            {t.cancelar}
          </button>
          <button
            type="button"
            disabled={borrando}
            onClick={() => iniciar(async () => setError((await borrarProducto(productoId)).error))}
            className="inline-flex min-h-11 items-center rounded-md bg-boton px-5 font-semibold text-boton-texto disabled:opacity-60"
          >
            {t.siBorrar}
          </button>
        </div>
      </dialog>
    </>
  );
}
