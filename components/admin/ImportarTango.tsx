"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { confirmarImportacion, prepararImportacion, type EstadoImportacion, type ImportacionPreparada } from "@/app/admin/acciones-importacion";
import { formatearPrecio } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.admin.importar;
const principal = "inline-flex min-h-11 items-center rounded-md bg-boton px-5 font-semibold text-boton-texto disabled:opacity-60";
const secundario = "inline-flex min-h-11 items-center rounded-md border border-dorado/60 px-4 disabled:opacity-60";
const control =
  "min-h-11 rounded-md border border-dorado/60 bg-superficie px-3 text-base text-texto focus:outline-2 focus:outline-dorado";
const enlace = "inline-flex min-h-11 items-center text-destacado underline-offset-4 hover:underline";

const DATOS = ["productosNuevos", "anadasNuevas", "preciosCambian", "sinCambios", "sinSeccion", "noSeImportan"] as const;

const POR_PAGINA = 50;

/** Productos nuevos con su sección: de a uno o de a varios (CA-11). */
function TablaNuevos({
  preparada,
  elecciones,
  cambiar,
}: {
  preparada: ImportacionPreparada;
  elecciones: string[];
  cambiar: (indices: number[], valor: string) => void;
}) {
  const [soloSinSeccion, setSoloSinSeccion] = useState(false);
  const [seleccion, setSeleccion] = useState<Set<number>>(new Set());
  const [pagina, setPagina] = useState(1);
  const [destino, setDestino] = useState("");

  const visibles = preparada.nuevos.map((_, i) => i).filter((i) => !soloSinSeccion || elecciones[i] === "");
  const paginas = Math.max(1, Math.ceil(visibles.length / POR_PAGINA));
  const actual = Math.min(pagina, paginas);
  const enPagina = visibles.slice((actual - 1) * POR_PAGINA, actual * POR_PAGINA);
  const todaLaPagina = enPagina.length > 0 && enPagina.every((i) => seleccion.has(i));
  const alternar = (indices: number[], marcar: boolean) =>
    setSeleccion((anterior) => {
      const nueva = new Set(anterior);
      indices.forEach((i) => (marcar ? nueva.add(i) : nueva.delete(i)));
      return nueva;
    });

  const opciones = (
    <>
      <option value="">{t.sinSeccion}</option>
      {preparada.opciones.filter((o) => !o.grupo).map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.etiqueta}
        </option>
      ))}
      {[...new Set(preparada.opciones.filter((o) => o.grupo).map((o) => o.grupo!))].map((grupo) => (
        <optgroup key={grupo} label={grupo}>
          {preparada.opciones.filter((o) => o.grupo === grupo).map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.etiqueta}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );

  return (
    <>
      <h3 className="mt-6 font-semibold text-destacado">{t.tablaNuevos}</h3>
      <p className="mt-1 max-w-prose text-texto-suave">{t.ayudaSecciones}</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            checked={soloSinSeccion}
            onChange={(e) => {
              setSoloSinSeccion(e.target.checked);
              setPagina(1);
            }}
            className="size-5 accent-dorado"
          />
          <span>{t.soloSinSeccion}</span>
        </label>
        <button type="button" onClick={() => alternar(visibles, true)} className={secundario}>
          {t.seleccionarFiltro(visibles.length)}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-3 rounded-md border border-dorado/30 p-3">
        <span className="min-h-11 content-center">{t.seleccionados(seleccion.size)}</span>
        <div className="flex flex-col gap-1">
          <label htmlFor="poner-en" className="text-sm text-texto-suave">{t.ponerEn}</label>
          <select id="poner-en" value={destino} onChange={(e) => setDestino(e.target.value)} className={control}>
            {opciones}
          </select>
        </div>
        <button
          type="button"
          disabled={seleccion.size === 0}
          onClick={() => {
            cambiar([...seleccion], destino);
            setSeleccion(new Set());
          }}
          className={principal}
        >
          {t.aplicarSeleccionados(seleccion.size)}
        </button>
      </div>
      <table aria-label={t.tablaNuevos} className="tabla-responsiva mt-3 w-full border-collapse text-left">
        <thead className="border-b border-dorado/40 text-sm text-texto-suave">
          <tr>
            <th scope="col" className="py-2 pr-2">
              <input
                type="checkbox"
                aria-label={t.elegirPagina}
                checked={todaLaPagina}
                onChange={(e) => alternar(enPagina, e.target.checked)}
                className="size-5 accent-dorado"
              />
            </th>
            <th scope="col" className="py-2 pr-4">{t.columnasNuevos.nombre}</th>
            <th scope="col" className="py-2 pr-4">{t.columnasNuevos.seccion}</th>
            <th scope="col" className="py-2 text-right">{t.columnasNuevos.anadas}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dorado/20">
          {enPagina.map((i) => {
            const p = preparada.nuevos[i];
            return (
              <tr key={i}>
                <td className="py-1 pr-2">
                  <input
                    type="checkbox"
                    aria-label={t.elegir(p.nombre)}
                    checked={seleccion.has(i)}
                    onChange={(e) => alternar([i], e.target.checked)}
                    className="size-5 accent-dorado"
                  />
                </td>
                <td className="py-1 pr-4">{p.nombre}</td>
                <td data-etiqueta={t.columnasNuevos.seccion} className="py-1 pr-4">
                  <select aria-label={t.seccionDe(p.nombre)} value={elecciones[i]} onChange={(e) => cambiar([i], e.target.value)} className={`${control} max-w-full`}>
                    {opciones}
                  </select>
                </td>
                <td data-etiqueta={t.columnasNuevos.anadas} className="py-1 tabular-nums md:text-right">{p.anadas}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {paginas > 1 && (
        <nav aria-label={t.tablaNuevos} className="mt-2 flex flex-wrap items-center gap-3">
          <button type="button" disabled={actual === 1} onClick={() => setPagina(actual - 1)} className={secundario}>
            {t.anterior}
          </button>
          <span>{t.paginaDe(actual, paginas)}</span>
          <button type="button" disabled={actual === paginas} onClick={() => setPagina(actual + 1)} className={secundario}>
            {t.siguiente}
          </button>
        </nav>
      )}
    </>
  );
}

function Resumen({ preparada, elecciones, cambiar }: { preparada: ImportacionPreparada; elecciones: string[]; cambiar: (indices: number[], valor: string) => void }) {
  // "Sin sección" cambia a medida que el encargado elige (CA-11).
  const r = { ...preparada.resumen, sinSeccion: elecciones.filter((e) => e === "").length };
  return (
    <>
      <p className="text-sm text-texto-suave">{t.deArchivo(preparada.archivo)}</p>
      <p className="mt-2 max-w-prose">{preparada.primera ? t.primeraVez : t.siguientes}</p>
      <dl className="mt-4 grid max-w-xl grid-cols-[1fr_auto] gap-x-6 gap-y-1">
        {DATOS.map((dato) => (
          <div key={dato} className="contents">
            <dt>{t.datos[dato]}</dt>
            <dd data-dato={dato} className="text-right font-semibold tabular-nums">
              {r[dato]}
            </dd>
          </div>
        ))}
        <dt>{t.datos.faltanEnArchivo}</dt>
        <dd data-dato="faltanEnArchivo" className="text-right font-semibold tabular-nums">
          {r.faltanEnArchivo.length}
        </dd>
      </dl>

      {r.problemas.length > 0 && (
        <>
          <h3 className="mt-6 font-semibold text-destacado">{t.problemas}</h3>
          <ul className="mt-2 list-disc pl-6">
            {r.problemas.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </>
      )}

      {preparada.precios.length > 0 && (
        <>
          <h3 className="mt-6 font-semibold text-destacado">{t.tablaPrecios}</h3>
          <table aria-label={t.tablaPrecios} className="tabla-responsiva mt-2 w-full max-w-xl border-collapse text-left">
            <thead className="border-b border-dorado/40 text-sm text-texto-suave">
              <tr>
                <th scope="col" className="py-2 pr-4">{t.columnasPrecios.codigo}</th>
                <th scope="col" className="py-2 pr-4 text-right">{t.columnasPrecios.anterior}</th>
                <th scope="col" className="py-2 text-right">{t.columnasPrecios.nuevo}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dorado/20">
              {preparada.precios.map((p) => (
                <tr key={p.codigo}>
                  <td className="py-1 pr-4">{p.codigo}</td>
                  <td data-etiqueta={t.columnasPrecios.anterior} className="py-1 pr-4 tabular-nums md:text-right">{formatearPrecio(p.anterior)}</td>
                  <td data-etiqueta={t.columnasPrecios.nuevo} className="py-1 tabular-nums md:text-right">{formatearPrecio(p.nuevo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {r.preciosCambian > preparada.precios.length && <p className="mt-1 text-sm text-texto-suave">{t.yMas(r.preciosCambian - preparada.precios.length)}</p>}
        </>
      )}

      {preparada.nuevos.length > 0 && <TablaNuevos preparada={preparada} elecciones={elecciones} cambiar={cambiar} />}
    </>
  );
}

export function ImportarTango() {
  const [estado, accion, leyendo] = useActionState<EstadoImportacion, FormData>(prepararImportacion, { error: null, preparada: null });
  const [resultado, setResultado] = useState<{ error: string | null; listo: string | null; id: string | null }>({ error: null, listo: null, id: null });
  const [importando, iniciar] = useTransition();
  const preparada = estado.preparada && estado.preparada.id !== resultado.id ? estado.preparada : null;
  // Sección elegida para cada producto nuevo; arranca con la sugerida (CA-11).
  const [elecciones, setElecciones] = useState<{ id: string | null; valores: string[] }>({ id: null, valores: [] });
  if (preparada && elecciones.id !== preparada.id) setElecciones({ id: preparada.id, valores: preparada.nuevos.map((p) => p.seccion) });
  const valores = preparada && elecciones.id === preparada.id ? elecciones.valores : [];
  const cambiar = (indices: number[], valor: string) =>
    setElecciones((e) => ({ ...e, valores: e.valores.map((v, i) => (indices.includes(i) ? valor : v)) }));

  return (
    <>
      <form action={accion} className="flex flex-wrap items-end gap-3">
        <div className="flex w-full min-w-0 flex-col gap-1 sm:w-auto">
          <label htmlFor="archivo-tango" className="text-sm text-texto-suave">{t.archivo}</label>
          <input
            id="archivo-tango"
            name="archivo"
            type="file"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            className="min-h-11 w-full min-w-0 text-base file:mr-3 file:min-h-11 file:rounded-md file:border file:border-dorado/60 file:bg-superficie file:px-4 file:text-texto"
          />
        </div>
        <button type="submit" disabled={leyendo} className={principal}>
          {leyendo ? t.leyendo : t.verCambios}
        </button>
      </form>
      {estado.error && (
        <p role="alert" className="mt-3 text-destacado">
          {estado.error}
        </p>
      )}

      {preparada && (
        <section aria-labelledby="titulo-resumen" className="mt-8">
          <h2 id="titulo-resumen" className="mb-2 text-lg font-semibold text-destacado">
            {t.resumen}
          </h2>
          <Resumen preparada={preparada} elecciones={valores} cambiar={cambiar} />
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={importando}
              className={principal}
              onClick={() =>
                iniciar(async () => {
                  // Solo se mandan las que cambiaron respecto de la sugerida.
                  const cambios = Object.fromEntries(
                    valores.flatMap((v, i) => (v !== preparada.nuevos[i].seccion ? [[i, v]] : [])),
                  );
                  const r = await confirmarImportacion(preparada.id, cambios);
                  const { productosNuevos, anadasNuevas, preciosCambian } = preparada.resumen;
                  setResultado({ error: r.error, listo: r.error ? null : t.listo(productosNuevos, anadasNuevas, preciosCambian), id: preparada.id });
                })
              }
            >
              {importando ? t.importando : t.importar}
            </button>
            <button type="button" onClick={() => setResultado({ error: null, listo: null, id: preparada.id })} className={secundario}>
              {t.cancelar}
            </button>
          </div>
        </section>
      )}

      {resultado.error && (
        <p role="alert" className="mt-4 text-destacado">
          {resultado.error}
        </p>
      )}
      {resultado.listo && (
        <div className="mt-6">
          <p role="status">{resultado.listo}</p>
          <p className="mt-2">{t.revisar}</p>
          <ul className="flex flex-wrap gap-x-4">
            <li>
              <Link href="/admin?estado=sin-seccion" className={enlace}>{t.verSinSeccion}</Link>
            </li>
            <li>
              <Link href="/admin?estado=ocultos" className={enlace}>{t.verOcultos}</Link>
            </li>
            <li>
              <Link href="/admin?estado=a-revisar" className={enlace}>{t.verARevisar}</Link>
            </li>
          </ul>
        </div>
      )}
    </>
  );
}
