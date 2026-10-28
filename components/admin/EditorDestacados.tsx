"use client";

import { useState, useTransition } from "react";
import { buscarParaDestacar, guardarDestacados } from "@/app/admin/acciones-destacados";
import { ManijaOrdenable, Ordenable, useElementoOrdenable } from "@/components/admin/Ordenable";
import type { ProductoDestacable } from "@/lib/admin/destacados";
import { textos } from "@/lib/textos";

const t = textos.admin.destacados;
const control =
  "min-h-11 rounded-md border border-dorado/60 bg-superficie px-3 text-base text-texto focus:outline-2 focus:outline-dorado";
const secundario = "inline-flex min-h-11 items-center rounded-md border border-dorado/60 px-4 disabled:opacity-60";
const principal = "inline-flex min-h-11 items-center rounded-md bg-boton px-5 font-semibold text-boton-texto disabled:opacity-60";

function Datos({ producto }: { producto: ProductoDestacable }) {
  return (
    <div className="min-w-0 flex-1">
      <h3 className="font-semibold">{producto.nombre}</h3>
      {producto.bodega && <p className="text-sm text-texto-suave">{producto.bodega}</p>}
      {!producto.enCarta && <p className="text-sm text-destacado">{t.noSeVe}</p>}
    </div>
  );
}

function FilaDestacado({ producto, onQuitar, ocupado }: { producto: ProductoDestacable; onQuitar: () => void; ocupado: boolean }) {
  const { ref, estilo, arrastrando, manija } = useElementoOrdenable(producto.id, producto.nombre);
  return (
    <li ref={ref} style={estilo} className={`flex items-center gap-3 py-2 ${arrastrando ? "bg-superficie shadow-lg" : ""}`}>
      <ManijaOrdenable manija={manija} />
      <Datos producto={producto} />
      <button type="button" onClick={onQuitar} disabled={ocupado} aria-label={t.quitar(producto.nombre)} className={secundario}>
        {t.quitarCorto}
      </button>
    </li>
  );
}

export function EditorDestacados({
  seccion,
  destacados,
}: {
  seccion: { id: string; nombre: string };
  destacados: ProductoDestacable[];
}) {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<ProductoDestacable[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();
  const ids = destacados.map((d) => d.id);

  // Agregar y quitar guardan la lista completa; la página se actualiza con lo guardado.
  function guardar(nuevos: string[]) {
    iniciar(async () => {
      const r = await guardarDestacados(seccion.id, nuevos);
      setError(r.error);
      if (!r.error) setResultados((actuales) => actuales?.filter((p) => !nuevos.includes(p.id)) ?? null);
    });
  }

  return (
    <>
      {destacados.length === 0 ? (
        <p className="mb-4">{t.vacia}</p>
      ) : (
        <Ordenable items={destacados} onCambio={(nuevos) => guardarDestacados(seccion.id, nuevos)}>
          {(ordenados) => (
            <ul aria-label={t.lista} className="divide-y divide-dorado/20">
              {ordenados.map((p) => (
                <FilaDestacado key={p.id} producto={p} ocupado={ocupado} onQuitar={() => guardar(ids.filter((id) => id !== p.id))} />
              ))}
            </ul>
          )}
        </Ordenable>
      )}
      {error && (
        <p role="alert" className="mt-2 text-destacado">
          {error}
        </p>
      )}

      <form
        className="mt-6 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          iniciar(async () => {
            const r = await buscarParaDestacar(seccion.id, texto);
            setError(r.error);
            setResultados(r.resultados);
          });
        }}
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="buscar-destacado" className="text-sm text-texto-suave">
            {t.agregarDe(seccion.nombre)}
          </label>
          <input id="buscar-destacado" type="search" value={texto} onChange={(e) => setTexto(e.target.value)} className={`${control} w-72`} />
        </div>
        <button type="submit" disabled={ocupado} className={principal}>
          {t.buscar}
        </button>
      </form>
      {resultados && resultados.length === 0 && <p className="mt-3 text-texto-suave">{t.sinResultados}</p>}
      {resultados && resultados.length > 0 && (
        <ul aria-label={t.resultados} className="mt-3 divide-y divide-dorado/20">
          {resultados.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2">
              <Datos producto={p} />
              <button
                type="button"
                disabled={ocupado}
                onClick={() => guardar([...ids, p.id])}
                aria-label={t.agregar(p.nombre)}
                className={secundario}
              >
                {t.agregarCorto}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
