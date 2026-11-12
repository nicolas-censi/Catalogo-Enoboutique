"use client";

import dynamic from "next/dynamic";
import { useActionState, useCallback, useState, useTransition } from "react";
import { agregarCodigo, agregarCodigoEscaneado, quitarCodigo, type EstadoCodigo } from "@/app/admin/acciones-codigos";
import { textos } from "@/lib/textos";

const t = textos.admin;
const te = textos.admin.escanear;
// El escáner (y la librería del lector) se descarga recién al tocar el botón.
const EscanerPanel = dynamic(() => import("@/components/admin/EscanerPanel").then((m) => m.EscanerPanel), { ssr: false });

function IconoEscanear() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3M7 8v8M10 8v8M13 8v8M17 8v8" />
    </svg>
  );
}
const control =
  "min-h-11 w-64 rounded-md border border-control bg-superficie px-3 font-mono text-base text-texto focus:outline-2 focus:outline-texto aria-[invalid=true]:border-destacado";

export function EditorCodigos({ productoId, codigos, sugerido }: { productoId: string; codigos: string[]; sugerido?: string | null }) {
  const [estado, accion, enviando] = useActionState<EstadoCodigo, FormData>(agregarCodigo.bind(null, productoId), {
    errorCampo: null,
    error: null,
    guardados: 0,
  });
  const [errorQuitar, setErrorQuitar] = useState<string | null>(null);
  const [quitando, iniciar] = useTransition();
  // Spec 019: escanear con la cámara.
  const [escaneando, setEscaneando] = useState(false);
  const [resultado, setResultado] = useState<{ aviso: string | null; error: string | null } | null>(null);
  const [guardandoEscaneo, iniciarEscaneo] = useTransition();
  const guardarEscaneado = useCallback(
    (codigo: string) => {
      setEscaneando(false);
      iniciarEscaneo(async () => setResultado(await agregarCodigoEscaneado(productoId, codigo)));
    },
    [productoId],
  );
  const abrirEscaner = () => {
    setResultado(null);
    setEscaneando(true);
  };

  return (
    <>
      {codigos.length === 0 ? (
        <p className="text-texto-suave">{t.sinCodigos}</p>
      ) : (
        <ul aria-label={t.codigosBarras} className="flex flex-wrap gap-2">
          {codigos.map((codigo) => (
            <li key={codigo} className="flex items-center gap-2 rounded-md border border-linea py-1 pr-1 pl-3">
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
        <p role="alert" className="mt-2 text-error">
          {errorQuitar}
        </p>
      )}
      {sugerido && !codigos.includes(sugerido) && !resultado && (
        <button
          type="button"
          disabled={guardandoEscaneo}
          onClick={() => guardarEscaneado(sugerido)}
          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md bg-boton px-5 font-semibold text-boton-texto disabled:opacity-60"
        >
          {te.agregarEste(sugerido)}
        </button>
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
        <button
          type="button"
          onClick={abrirEscaner}
          disabled={guardandoEscaneo}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-control px-4 disabled:opacity-60"
        >
          <IconoEscanear />
          {te.boton}
        </button>
        {estado.errorCampo && (
          <span id="error-codigo-barras" className="basis-full text-sm text-destacado">
            {estado.errorCampo}
          </span>
        )}
        {estado.error && (
          <p role="alert" className="basis-full text-error">
            {estado.error}
          </p>
        )}
      </form>
      {(guardandoEscaneo || resultado) && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {guardandoEscaneo && <p role="status">{te.guardando}</p>}
          {resultado?.aviso && <p role="status">{resultado.aviso}</p>}
          {resultado?.error && (
            <p role="alert" className="text-error">
              {resultado.error}
            </p>
          )}
          {resultado && (
            <button type="button" onClick={abrirEscaner} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-control px-4">
              <IconoEscanear />
              {te.otro}
            </button>
          )}
        </div>
      )}
      {escaneando && <EscanerPanel titulo={te.titulo} alLeer={guardarEscaneado} alCerrar={() => setEscaneando(false)} />}
    </>
  );
}
