"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { buscarPorCodigo } from "@/app/admin/acciones-codigos";
import { Chip } from "@/components/admin/ui/Chip";
import { enlaceLista } from "@/lib/admin/enlaces";
import type { EstadoFiltro, Filtros, SeccionConSubsecciones } from "@/lib/admin/productos";
import { nombreConSeccion } from "@/lib/admin/secciones";
import { textos } from "@/lib/textos";

// Spec 019: el escáner (y la librería del lector) se descarga recién al tocar el botón.
const EscanerPanel = dynamic(() => import("@/components/admin/EscanerPanel").then((m) => m.EscanerPanel), { ssr: false });
const te = textos.admin.escanear;

const ESTADOS: EstadoFiltro[] = ["sin-seccion", "sin-foto", "a-revisar", "ocultos", "sin-stock"];

/**
 * Spec 014, CA-4: buscador (busca al escribir y con Enter; sin JavaScript, con Enter) y
 * filtros de un toque. Todo queda en la dirección.
 */
export function FiltrosProductos({ filtros, secciones }: { filtros: Filtros; secciones: SeccionConSubsecciones[] }) {
  const router = useRouter();
  const [texto, setTexto] = useState(filtros.q);
  const primera = useRef(true);
  // Spec 019, CA-2: escanear una botella abre su producto o deja el código para asignarlo.
  const [escaneando, setEscaneando] = useState(false);
  const [buscando, iniciarBusqueda] = useTransition();
  const alLeer = useCallback(
    (codigo: string) => {
      setEscaneando(false);
      iniciarBusqueda(async () => {
        const producto = await buscarPorCodigo(codigo);
        if (producto) router.push(`/admin/productos/${producto.id}?pestana=codigos`);
        else {
          setTexto("");
          router.push(enlaceLista(filtros, { q: "", codigo }));
        }
      });
    },
    [filtros, router],
  );

  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    if (texto.trim() === filtros.q) return;
    const espera = setTimeout(() => router.replace(enlaceLista(filtros, { q: texto.trim() })), 400);
    return () => clearTimeout(espera);
  }, [texto, filtros, router]);

  return (
    <div className="flex flex-col gap-3">
      <form method="get" action="/admin" role="search" className="relative">
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-texto-suave">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          name="q"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-label={textos.admin.buscarProductos}
          placeholder={textos.admin.buscarProductosAyuda}
          autoFocus
          autoComplete="off"
          className="min-h-12 w-full rounded-xl border border-control bg-superficie pr-14 pl-11 text-base text-texto placeholder:text-texto-suave focus:outline-2 focus:outline-texto"
        />
        <button
          type="button"
          onClick={() => setEscaneando(true)}
          disabled={buscando}
          aria-label={te.buscarEnLista}
          className="absolute top-1/2 right-1 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-texto hover:bg-fondo focus:outline-2 focus:outline-texto disabled:opacity-60"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3M7 8v8M10 8v8M13 8v8M17 8v8" />
          </svg>
        </button>
        {filtros.seccion && <input type="hidden" name="seccion" value={filtros.seccion} />}
        {filtros.estado && <input type="hidden" name="estado" value={filtros.estado} />}
        {filtros.codigo && <input type="hidden" name="codigo" value={filtros.codigo} />}
      </form>
      {escaneando && <EscanerPanel titulo={te.titulo} alLeer={alLeer} alCerrar={() => setEscaneando(false)} />}
      <div role="group" aria-label={textos.admin.lista.filtros} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        <Chip href={enlaceLista(filtros, { estado: "" })} activo={!filtros.estado}>
          {textos.admin.todos}
        </Chip>
        {ESTADOS.map((e) => (
          <Chip key={e} href={enlaceLista(filtros, { estado: e })} activo={filtros.estado === e}>
            {textos.admin.estados[e]}
          </Chip>
        ))}
        <span className="relative inline-flex shrink-0">
          <select
            aria-label={textos.admin.seccion}
            value={filtros.seccion}
            onChange={(e) => router.push(enlaceLista(filtros, { seccion: e.target.value }))}
            className={`min-h-11 appearance-none rounded-full border pr-9 pl-4 text-sm ${filtros.seccion ? "border-texto bg-texto text-fondo" : "border-linea bg-superficie text-texto"}`}
          >
            <option value="">{`${textos.admin.seccion}: ${textos.admin.todasLasSecciones}`}</option>
            {secciones.flatMap((s) => [
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>,
              ...s.subsecciones.map((h) => (
                <option key={h.id} value={h.id}>
                  {nombreConSeccion(s.nombre, h.nombre)}
                </option>
              )),
            ])}
          </select>
          <span aria-hidden="true" className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-xs">
            ▾
          </span>
        </span>
      </div>
    </div>
  );
}
