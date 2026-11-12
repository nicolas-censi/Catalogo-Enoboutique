"use client";

// Spec 019: escáner del panel, en un diálogo. Usa la misma cámara y lector que la carta
// (useLectorCamara). Se monta solo mientras está abierto: al cerrarlo, la cámara se apaga.
import { useEffect, useRef } from "react";
import { useLectorCamara } from "@/components/useLectorCamara";
import { textos } from "@/lib/textos";

const t = textos.escaner;

export function EscanerPanel({ titulo, alLeer, alCerrar }: { titulo: string; alLeer: (codigo: string) => void; alCerrar: () => void }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const { video, estado, reintentar, apagar } = useLectorCamara(alLeer);

  useEffect(() => {
    const d = dialogo.current;
    if (d && !d.open) d.showModal();
    return () => d?.close();
  }, []);

  const cerrar = () => {
    apagar();
    alCerrar();
  };
  const mostrarVideo = estado.tipo === "iniciando" || estado.tipo === "escaneando";
  const mensaje =
    estado.tipo === "iniciando" ? t.iniciando
    : estado.tipo === "escaneando" ? t.apuntando
    : estado.tipo === "error" ? estado.mensaje
    : textos.admin.escanear.guardando;

  return (
    <dialog
      ref={dialogo}
      aria-labelledby="titulo-escaner-panel"
      onCancel={(e) => {
        e.preventDefault();
        cerrar();
      }}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-xl bg-fondo p-4 text-texto shadow-xl backdrop:bg-texto/50"
    >
      <h2 id="titulo-escaner-panel" className="font-titulos text-xl">
        {titulo}
      </h2>
      <div className={`relative mt-3 overflow-hidden rounded-lg border border-linea bg-superficie ${mostrarVideo ? "" : "hidden"}`}>
        <video ref={video} aria-label={t.camara} muted playsInline className="block aspect-[3/4] max-h-[60dvh] w-full object-cover" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-[12%] top-[38%] h-[24%] rounded-md border-2 border-dorado" />
      </div>
      <p role="status" aria-live="polite" className="mt-3">
        {mensaje}
      </p>
      {estado.tipo === "escaneando" && <p className="text-sm text-texto-suave">{t.encuadrar}</p>}
      {estado.tipo === "error" && estado.codigo && <p className="text-sm text-texto-suave">{t.codigoProblema(estado.codigo)}</p>}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {estado.tipo === "error" && (
          <button type="button" onClick={reintentar} className="min-h-11 rounded-md bg-boton px-5 font-semibold text-boton-texto">
            {t.escanearDeNuevo}
          </button>
        )}
        <button type="button" onClick={cerrar} className="min-h-11 rounded-md border border-control px-5">
          {t.cerrar}
        </button>
      </div>
    </dialog>
  );
}
