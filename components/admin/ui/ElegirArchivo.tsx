"use client";

import { useState, type ChangeEvent } from "react";
import { claseBoton } from "@/components/admin/ui/boton";
import { textos } from "@/lib/textos";

/**
 * Spec 014: elegir un archivo con un botón en español ("Elegir archivo") y el nombre del
 * elegido, en lugar del control del navegador ("Choose File"). El campo real sigue en el
 * formulario (oculto a la vista, no al teclado ni al lector de pantalla).
 */
export function ElegirArchivo({
  id,
  etiqueta,
  name,
  accept,
  onChange,
  mostrarNombre = true,
}: {
  id: string;
  etiqueta: string;
  name?: string;
  accept: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  mostrarNombre?: boolean;
}) {
  const [nombre, setNombre] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-1">
      <input
        id={id}
        name={name}
        type="file"
        accept={accept}
        aria-label={etiqueta}
        onChange={(e) => {
          setNombre(e.target.files?.[0]?.name ?? null);
          onChange?.(e);
        }}
        className="peer sr-only"
      />
      <span aria-hidden="true" className="text-sm text-texto-suave">
        {etiqueta}
      </span>
      {/* Lo que se ve y se toca; el nombre accesible lo da aria-label del campo. */}
      <label htmlFor={id} aria-hidden="true" className="flex cursor-pointer flex-wrap items-center gap-3 peer-focus-visible:[&>span:first-child]:outline-2 peer-focus-visible:[&>span:first-child]:outline-texto">
        <span className={claseBoton("secundario")}>{textos.admin.ui.elegirArchivo}</span>
        {mostrarNombre && <span className="text-texto-suave">{nombre ?? textos.admin.ui.ningunArchivo}</span>}
      </label>
    </div>
  );
}
