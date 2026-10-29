"use client";

import { useState, useTransition } from "react";
import { renombrarBodega } from "@/app/admin/acciones-importacion";
import type { BodegaTango } from "@/lib/admin/importacion";
import { textos } from "@/lib/textos";

const t = textos.admin.importar.bodegas;
const control =
  "min-h-11 rounded-md border border-dorado/60 bg-superficie px-3 text-base text-texto focus:outline-2 focus:outline-dorado";
const secundario = "inline-flex min-h-11 items-center rounded-md border border-dorado/60 px-4 disabled:opacity-60";

function FilaBodega({ bodega }: { bodega: BodegaTango }) {
  const [nombre, setNombre] = useState(bodega.nombre);
  const [mensaje, setMensaje] = useState<{ error: string | null; guardado: boolean }>({ error: null, guardado: false });
  const [guardando, iniciar] = useTransition();
  const id = `bodega-${bodega.id}`;
  return (
    <tr>
      <td className="py-1 pr-4 font-semibold">{bodega.codigo}</td>
      <td data-etiqueta={t.columnas.nombre} className="py-1 pr-4">
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            iniciar(async () => {
              const r = await renombrarBodega(bodega.id, nombre);
              setMensaje({ error: r.error, guardado: !r.error });
            });
          }}
        >
          <label htmlFor={id} className="sr-only">
            {t.nombreDe(bodega.codigo)}
          </label>
          <input id={id} value={nombre} onChange={(e) => setNombre(e.target.value)} className={`${control} w-64`} />
          <button type="submit" disabled={guardando} className={secundario}>
            {t.guardar}
          </button>
          {mensaje.guardado && <span role="status" className="text-sm text-texto-suave">{textos.admin.guardado}</span>}
          {mensaje.error && <span role="alert" className="text-sm text-destacado">{mensaje.error}</span>}
        </form>
      </td>
      <td data-etiqueta={t.columnas.productos} className="py-1 text-texto-suave">{textos.admin.cantidadProductos(bodega.productos)}</td>
    </tr>
  );
}

export function EditorBodegasTango({ bodegas }: { bodegas: BodegaTango[] }) {
  if (bodegas.length === 0) return <p>{t.vacia}</p>;
  return (
    <table aria-label={t.tabla} className="tabla-responsiva w-full border-collapse text-left">
      <thead className="border-b border-dorado/40 text-sm text-texto-suave">
        <tr>
          <th scope="col" className="py-2 pr-4">{t.columnas.codigo}</th>
          <th scope="col" className="py-2 pr-4">{t.columnas.nombre}</th>
          <th scope="col" className="py-2">{t.columnas.productos}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-dorado/20">
        {bodegas.map((b) => (
          <FilaBodega key={b.id} bodega={b} />
        ))}
      </tbody>
    </table>
  );
}
