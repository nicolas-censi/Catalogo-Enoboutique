"use client";

import { useActionState, useState, useTransition } from "react";
import { agregarCodigo, quitarCodigo, type EstadoCodigo } from "@/app/admin/acciones-codigos";
import { textos } from "@/lib/textos";

const t = textos.admin;
const control =
  "min-h-11 w-64 rounded-md border border-dorado/60 bg-superficie px-3 font-mono text-base text-texto focus:outline-2 focus:outline-dorado aria-[invalid=true]:border-destacado";

export function EditorCodigos({ productoId, codigos }: { productoId: string; codigos: string[] }) {
  const [estado, accion, enviando] = useActionState<EstadoCodigo, FormData>(agregarCodigo.bind(null, productoId), {
    errorCampo: null,
    error: null,
    guardados: 0,
  });
  const [errorQuitar, setErrorQuitar] = useState<string | null>(null);
  const [quitando, iniciar] = useTransition();

  return (
    <>
      {codigos.length === 0 ? (
        <p className="text-texto-suave">{t.sinCodigos}</p>
      ) : (
        <ul aria-label={t.codigosBarras} className="flex flex-wrap gap-2">
          {codigos.map((codigo) => (
            <li key={codigo} className="flex items-center gap-2 rounded-md border border-dorado/40 py-1 pr-1 pl-3">
              <span className="font-mono">{codigo}</span>
              <button
                type="button"
                disabled={quitando}
                aria-label={t.quitarCodigo(codigo)}
                onClick={() => iniciar(async () => setErrorQuitar((await quitarCodigo(productoId, codigo)).error))}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-3 text-texto-suave hover:text-destacado"
              >
                {t.quitar}
              </button>
            </li>
          ))}
        </ul>
      )}
      {errorQuitar && (
        <p role="alert" className="mt-2 text-destacado">
          {errorQuitar}
        </p>
      )}
      <form action={accion} aria-label={t.agregarCodigo} key={estado.guardados} noValidate className="mt-3 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="codigo-barras-nuevo" className="text-sm text-texto-suave">
            {t.codigoBarras}
          </label>
          <input
            id="codigo-barras-nuevo"
            name="codigo"
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={!!estado.errorCampo}
            aria-describedby={estado.errorCampo ? "error-codigo-barras" : undefined}
            className={control}
          />
        </div>
        <button type="submit" disabled={enviando} className="min-h-11 rounded-md bg-boton px-5 font-semibold text-boton-texto disabled:opacity-60">
          {t.agregar}
        </button>
        {estado.errorCampo && (
          <span id="error-codigo-barras" className="basis-full text-sm text-destacado">
            {estado.errorCampo}
          </span>
        )}
        {estado.error && (
          <p role="alert" className="basis-full text-destacado">
            {estado.error}
          </p>
        )}
      </form>
    </>
  );
}
