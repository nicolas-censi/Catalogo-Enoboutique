"use client";

import { useId, useState, useTransition, type ReactNode } from "react";
import { aprobarSugerencia, descartarSugerencia } from "@/app/admin/acciones-sugerencias";
import { useAvisoSugerencia } from "@/components/admin/ZonaSugerencia";
import { textos } from "@/lib/textos";

const t = textos.admin.sugerencias;
const principal = "inline-flex min-h-11 items-center rounded-md bg-boton px-5 font-semibold text-boton-texto disabled:opacity-60";
const secundario = "inline-flex min-h-11 items-center rounded-md border border-control px-4 disabled:opacity-60";

/**
 * Spec 007, CA-5: lo actual al lado de lo sugerido; se corrige el texto, se elige qué
 * usar y se aprueba o descarta. Lo usan la ficha y la bandeja Para revisar.
 */
export function RevisarSugerencia({
  id,
  descripcion,
  motivoSinDescripcion,
  hayFoto,
  descripcionActual,
  fotoActual,
  fotoSugerida,
  fuentes,
  etiqueta = t.titulo,
  encabezado,
}: {
  etiqueta?: string;
  encabezado?: ReactNode;
  id: string;
  descripcion: string | null;
  motivoSinDescripcion: string | null;
  hayFoto: boolean;
  descripcionActual: ReactNode;
  fotoActual: ReactNode;
  fotoSugerida: ReactNode;
  fuentes: ReactNode;
}) {
  const base = useId();
  const [texto, setTexto] = useState(descripcion ?? "");
  const [usarDescripcion, setUsarDescripcion] = useState(descripcion !== null);
  const [usarFoto, setUsarFoto] = useState(hayFoto);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();
  const avisar = useAvisoSugerencia();

  const accion = (fn: () => Promise<{ error: string | null }>, aviso: string) =>
    iniciar(async () => {
      avisar(null);
      const r = await fn();
      setError(r.error);
      if (!r.error) avisar(aviso);
    });

  return (
    <article aria-label={etiqueta} className="flex flex-col gap-5 rounded-md border border-linea p-4">
      {encabezado}
      <div className="grid gap-4 sm:grid-cols-2">
        <section aria-label={t.descripcionActual}>
          <h3 className="text-sm text-texto-suave">{t.descripcionActual}</h3>
          <div className="mt-1">{descripcionActual}</div>
        </section>
        <section aria-label={t.descripcionSugerida}>
          <h3 className="text-sm font-semibold text-titulo">{t.descripcionSugerida}</h3>
          {descripcion !== null ? (
            <>
              <label htmlFor={`${base}-texto`} className="sr-only">
                {t.editarDescripcion}
              </label>
              <textarea
                id={`${base}-texto`}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={5}
                className="mt-1 w-full rounded-md border border-control bg-fondo px-3 py-2"
              />
            </>
          ) : (
            <p className="mt-1">{motivoSinDescripcion}</p>
          )}
        </section>
        <section aria-label={t.fotoActual}>
          <h3 className="text-sm text-texto-suave">{t.fotoActual}</h3>
          <div className="mt-1">{fotoActual}</div>
        </section>
        <section aria-label={t.fotoSugerida}>
          <h3 className="text-sm font-semibold text-titulo">{t.fotoSugerida}</h3>
          <div className="mt-1">{fotoSugerida}</div>
        </section>
      </div>
      {fuentes}
      <fieldset className="flex flex-wrap gap-x-6 gap-y-2">
        <legend className="mb-1 text-sm text-texto-suave">{t.usar}</legend>
        {descripcion !== null && (
          <label className="inline-flex min-h-11 items-center gap-2">
            <input type="checkbox" checked={usarDescripcion} onChange={(e) => setUsarDescripcion(e.target.checked)} className="size-5 accent-texto" />
            {t.usarDescripcion}
          </label>
        )}
        {hayFoto && (
          <label className="inline-flex min-h-11 items-center gap-2">
            <input type="checkbox" checked={usarFoto} onChange={(e) => setUsarFoto(e.target.checked)} className="size-5 accent-texto" />
            {t.usarFoto}
          </label>
        )}
      </fieldset>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={ocupado || (!usarFoto && !usarDescripcion)}
          className={principal}
          onClick={() => accion(() => aprobarSugerencia(id, { descripcion: usarDescripcion ? texto : null, usarFoto }), t.aprobada)}
        >
          {t.aprobar}
        </button>
        <button type="button" disabled={ocupado} className={secundario} onClick={() => accion(() => descartarSugerencia(id), t.descartada)}>
          {t.descartar}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-error">
          {error}
        </p>
      )}
    </article>
  );
}
