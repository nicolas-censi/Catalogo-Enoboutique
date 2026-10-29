"use client";

import { useActionState, useState, useTransition } from "react";
import { borrarAbreviatura, guardarAbreviatura, type EstadoAbreviatura } from "@/app/admin/acciones-importacion";
import type { Abreviatura } from "@/lib/tango/nombres";
import { textos } from "@/lib/textos";

const t = textos.admin.importar.abreviaturas;
const control =
  "min-h-11 rounded-md border border-dorado/60 bg-superficie px-3 text-base text-texto focus:outline-2 focus:outline-dorado aria-[invalid=true]:border-destacado";
const secundario = "inline-flex min-h-11 items-center rounded-md border border-dorado/60 px-4 disabled:opacity-60";
const principal = "inline-flex min-h-11 items-center rounded-md bg-boton px-5 font-semibold text-boton-texto disabled:opacity-60";

export function EditorAbreviaturas({ abreviaturas }: { abreviaturas: Abreviatura[] }) {
  const [estado, accion, guardando] = useActionState<EstadoAbreviatura, FormData>(guardarAbreviatura, { errores: {}, error: null, guardadas: 0 });
  // "Cambiar" carga la abreviatura en el formulario.
  const [editando, setEditando] = useState<Abreviatura | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [borrando, iniciar] = useTransition();
  const e = estado.errores;
  const clave = `${estado.guardadas}-${editando?.abreviatura ?? ""}`;

  return (
    <>
      <form action={accion} key={clave} noValidate className="flex flex-wrap items-start gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="abreviatura" className="text-sm text-texto-suave">{t.abreviatura}</label>
          <input
            id="abreviatura"
            name="abreviatura"
            defaultValue={editando?.abreviatura}
            autoCapitalize="characters"
            aria-invalid={!!e.abreviatura}
            aria-describedby={e.abreviatura ? "error-abreviatura" : undefined}
            className={`${control} w-40 uppercase`}
          />
          {e.abreviatura && <span id="error-abreviatura" className="max-w-40 text-sm text-destacado">{e.abreviatura}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="expansion" className="text-sm text-texto-suave">{t.expansion}</label>
          <input
            id="expansion"
            name="expansion"
            defaultValue={editando?.expansion}
            aria-invalid={!!e.expansion}
            aria-describedby={e.expansion ? "error-expansion" : undefined}
            className={`${control} w-64`}
          />
          {e.expansion && <span id="error-expansion" className="max-w-64 text-sm text-destacado">{e.expansion}</span>}
        </div>
        <label className="mt-6 flex min-h-11 items-center gap-2">
          <input type="checkbox" name="es_varietal" defaultChecked={editando?.esVarietal} className="size-5 accent-dorado" />
          <span>{t.esVarietal}</span>
        </label>
        <button type="submit" disabled={guardando} className={`${principal} mt-6`}>
          {t.guardar}
        </button>
        {estado.error && <p role="alert" className="basis-full text-destacado">{estado.error}</p>}
      </form>
      {error && <p role="alert" className="mt-3 text-destacado">{error}</p>}

      <table aria-label={t.tabla} className="tabla-responsiva mt-6 w-full border-collapse text-left">
        <thead className="border-b border-dorado/40 text-sm text-texto-suave">
          <tr>
            <th scope="col" className="py-2 pr-4">{t.columnas.abreviatura}</th>
            <th scope="col" className="py-2 pr-4">{t.columnas.expansion}</th>
            <th scope="col" className="py-2 pr-4">{t.columnas.tipo}</th>
            <th scope="col" className="py-2">{textos.admin.acciones}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dorado/20">
          {abreviaturas.map((a) => (
            <tr key={a.abreviatura}>
              <td className="py-1 pr-4 font-semibold">{a.abreviatura}</td>
              <td data-etiqueta={t.columnas.expansion} className="py-1 pr-4">{a.expansion}</td>
              <td data-etiqueta={t.columnas.tipo} className="py-1 pr-4 text-texto-suave">{a.esVarietal ? t.varietal : t.otra}</td>
              <td data-etiqueta={textos.admin.acciones} className="py-1">
                <span className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setEditando(a)} className={secundario}>
                    {t.cambiar}
                  </button>
                  <button
                    type="button"
                    disabled={borrando}
                    onClick={() => iniciar(async () => setError((await borrarAbreviatura(a.abreviatura)).error))}
                    className={secundario}
                  >
                    {t.borrar}
                  </button>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
