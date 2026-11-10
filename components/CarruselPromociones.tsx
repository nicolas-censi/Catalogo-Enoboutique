"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { textos } from "@/lib/textos";

const t = textos.promociones;
const CADA_MS = 5000;
const MOVIMIENTO = "(prefers-reduced-motion: reduce)";

/** ¿El celular tiene activado "reducir movimiento"? (en el servidor, no). */
function useReducirMovimiento() {
  return useSyncExternalStore(
    (avisar) => {
      const consulta = window.matchMedia(MOVIMIENTO);
      consulta.addEventListener("change", avisar);
      return () => consulta.removeEventListener("change", avisar);
    },
    () => window.matchMedia(MOVIMIENTO).matches,
    () => false,
  );
}

/**
 * Promociones del inicio (spec 013, CA-4 y CA-5): carrusel de borde a borde que pasa
 * solo cada 5 segundos (salvo con "reducir movimiento"), se desliza con el dedo
 * (scroll-snap: también sin JavaScript) y tiene botón para pausar. Al tocar una imagen
 * se ve entera, a pantalla completa, con Cerrar (o Escape, o el botón Atrás).
 */
export function CarruselPromociones({ imagenes }: { imagenes: string[] }) {
  const pista = useRef<HTMLUListElement>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const [actual, setActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  // Pausa mientras el cliente toca, desliza o recorre con el teclado.
  const [enUso, setEnUso] = useState(false);
  const reducido = useReducirMovimiento();
  const [ampliada, setAmpliada] = useState<number | null>(null);
  const total = imagenes.length;

  const irA = useCallback(
    (indice: number) => {
      const el = pista.current;
      if (!el) return;
      el.scrollTo({ left: indice * el.clientWidth, behavior: reducido ? "auto" : "smooth" });
    },
    [reducido],
  );

  // Pase automático.
  useEffect(() => {
    if (total < 2 || pausado || enUso || reducido || ampliada !== null) return;
    const espera = setTimeout(() => irA((actual + 1) % total), CADA_MS);
    return () => clearTimeout(espera);
  }, [actual, total, pausado, enUso, reducido, ampliada, irA]);

  // El botón Atrás del celular cierra la imagen ampliada en vez de salir de la carta.
  useEffect(() => {
    if (ampliada === null) return;
    const atras = () => dialogo.current?.close();
    window.addEventListener("popstate", atras);
    return () => window.removeEventListener("popstate", atras);
  }, [ampliada]);

  function abrir(indice: number) {
    setAmpliada(indice);
    window.history.pushState({ ...window.history.state, promocion: true }, "");
    dialogo.current?.showModal();
  }

  /** Todo cierre pasa por acá (botón Cerrar, Escape o Atrás). */
  function alCerrar() {
    setAmpliada(null);
    // Si no se cerró con Atrás, se saca la entrada que se sumó al abrir.
    if (window.history.state?.promocion) window.history.back();
  }

  if (total === 0) return null;

  return (
    <section aria-label={t.titulo} className="-mx-6 mt-12">
      <ul
        ref={pista}
        onScroll={(e) => {
          const el = e.currentTarget;
          setActual(Math.round(el.scrollLeft / el.clientWidth));
        }}
        onPointerDown={() => setEnUso(true)}
        onPointerUp={() => setEnUso(false)}
        onPointerCancel={() => setEnUso(false)}
        onFocus={() => setEnUso(true)}
        onBlur={() => setEnUso(false)}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
      >
        {imagenes.map((url, i) => (
          <li key={url} className="w-full shrink-0 snap-center">
            <button type="button" onClick={() => abrir(i)} className="tocable block w-full" aria-label={t.ver(i + 1, total)}>
              <Image src={url} alt={t.nombre(i + 1, total)} width={1600} height={900} sizes="(max-width: 640px) 100vw, 576px" className="aspect-[16/9] w-full bg-superficie object-cover" />
            </button>
          </li>
        ))}
      </ul>

      {total > 1 && (
        <div className="flex items-center gap-3 px-6 pt-2">
          <div aria-hidden="true" className="flex flex-1 gap-1">
            {imagenes.map((url, i) => (
              <span key={url} className={`h-0.5 flex-1 transition-colors ${i === actual ? "bg-dorado" : "bg-dorado/30"}`} />
            ))}
          </div>
          {!reducido && (
            <button
              type="button"
              onClick={() => setPausado((p) => !p)}
              aria-label={pausado ? t.reanudar : t.pausar}
              aria-pressed={pausado}
              className="tocable inline-flex size-11 items-center justify-center text-texto"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                {pausado ? <path d="M8 5v14l11-7z" /> : <path d="M7 5h4v14H7zM13 5h4v14h-4z" />}
              </svg>
            </button>
          )}
        </div>
      )}

      <dialog
        ref={dialogo}
        aria-label={ampliada === null ? t.titulo : t.nombre(ampliada + 1, total)}
        onClose={alCerrar}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-fondo p-0 text-texto backdrop:bg-fondo"
      >
        {ampliada !== null && (
          <div className="flex h-full flex-col">
            <div className="flex justify-end p-2">
              <button type="button" onClick={() => dialogo.current?.close()} className="tocable inline-flex min-h-11 items-center gap-2 rounded-full border border-control px-4 text-titulo">
                <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
                {t.cerrar}
              </button>
            </div>
            <div className="relative min-h-0 flex-1">
              <Image src={imagenes[ampliada]} alt={t.nombre(ampliada + 1, total)} fill sizes="100vw" className="object-contain" />
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
