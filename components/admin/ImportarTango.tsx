"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { confirmarImportacion, prepararImportacion, type EstadoImportacion, type ImportacionPreparada } from "@/app/admin/acciones-importacion";
import { formatearPrecio } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.admin.importar;
const principal = "inline-flex min-h-11 items-center rounded-md bg-boton px-5 font-semibold text-boton-texto disabled:opacity-60";
const secundario = "inline-flex min-h-11 items-center rounded-md border border-dorado/60 px-4";
const enlace = "inline-flex min-h-11 items-center text-destacado underline-offset-4 hover:underline";

const DATOS = ["productosNuevos", "anadasNuevas", "preciosCambian", "sinCambios", "sinSeccion", "noSeImportan"] as const;

function Resumen({ preparada }: { preparada: ImportacionPreparada }) {
  const r = preparada.resumen;
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

      {preparada.nuevos.length > 0 && (
        <>
          <h3 className="mt-6 font-semibold text-destacado">{t.tablaNuevos}</h3>
          <table aria-label={t.tablaNuevos} className="tabla-responsiva mt-2 w-full border-collapse text-left">
            <thead className="border-b border-dorado/40 text-sm text-texto-suave">
              <tr>
                <th scope="col" className="py-2 pr-4">{t.columnasNuevos.nombre}</th>
                <th scope="col" className="py-2 pr-4">{t.columnasNuevos.seccion}</th>
                <th scope="col" className="py-2 text-right">{t.columnasNuevos.anadas}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dorado/20">
              {preparada.nuevos.map((p, i) => (
                <tr key={i}>
                  <td className="py-1 pr-4">{p.nombre}</td>
                  <td data-etiqueta={t.columnasNuevos.seccion} className="py-1 pr-4">
                    {p.seccion ?? <span className="text-texto-suave">{t.sinSeccion}</span>}
                  </td>
                  <td data-etiqueta={t.columnasNuevos.anadas} className="py-1 tabular-nums md:text-right">{p.anadas}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {r.productosNuevos > preparada.nuevos.length && (
            <p className="mt-1 text-sm text-texto-suave">{t.yMas(r.productosNuevos - preparada.nuevos.length)}</p>
          )}
        </>
      )}
    </>
  );
}

export function ImportarTango() {
  const [estado, accion, leyendo] = useActionState<EstadoImportacion, FormData>(prepararImportacion, { error: null, preparada: null });
  const [resultado, setResultado] = useState<{ error: string | null; listo: string | null; id: string | null }>({ error: null, listo: null, id: null });
  const [importando, iniciar] = useTransition();
  const preparada = estado.preparada && estado.preparada.id !== resultado.id ? estado.preparada : null;

  return (
    <>
      <form action={accion} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="archivo-tango" className="text-sm text-texto-suave">{t.archivo}</label>
          <input
            id="archivo-tango"
            name="archivo"
            type="file"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            className="min-h-11 max-w-full text-base file:mr-3 file:min-h-11 file:rounded-md file:border file:border-dorado/60 file:bg-superficie file:px-4 file:text-texto"
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
          <Resumen preparada={preparada} />
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={importando}
              className={principal}
              onClick={() =>
                iniciar(async () => {
                  const r = await confirmarImportacion(preparada.id);
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
