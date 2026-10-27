"use client";

import { useActionState, useState, useTransition } from "react";
import { borrarAnada, guardarAnada, type EstadoAnada } from "@/app/admin/acciones-anadas";
import { InterruptorStock } from "@/components/admin/InterruptorStock";
import type { AnadaAdmin } from "@/lib/admin/productos";
import { formatearPrecio } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.admin;
const control =
  "min-h-11 w-full rounded-md border border-dorado/60 bg-superficie px-3 text-base text-texto focus:outline-2 focus:outline-dorado aria-[invalid=true]:border-destacado";
const botonSecundario = "inline-flex min-h-11 items-center rounded-md border border-dorado/60 px-4";
const botonPrincipal = "inline-flex min-h-11 items-center rounded-md bg-boton px-5 font-semibold text-boton-texto disabled:opacity-60";
const sinErrores: EstadoAnada = { errores: {}, error: null, guardados: 0 };
const numero = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

export function etiquetaAnada(anada: Pick<AnadaAdmin, "tipo" | "anio">) {
  if (anada.tipo === "con_anio") return String(anada.anio);
  return anada.tipo === "sin_especificar" ? t.aRevisarAnio : t.sinAnio;
}

function Campo({
  nombre,
  etiqueta,
  error,
  idError,
  children,
}: {
  nombre: string;
  etiqueta: string;
  error?: string;
  idError: string;
  children: (props: {
    id: string;
    name: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
    className: string;
  }) => React.ReactNode;
}) {
  // La etiqueta se asocia por id (no envolviendo el campo): si envolviera un <select>,
  // su nombre accesible incluiría el texto de las opciones.
  const id = `${idError}-campo`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-texto-suave">
        {etiqueta}
      </label>
      {children({ id, name: nombre, "aria-invalid": !!error, "aria-describedby": error ? idError : undefined, className: control })}
      {error && (
        <span id={idError} className="text-sm text-destacado">
          {error}
        </span>
      )}
    </div>
  );
}

/** Formulario de una añada: alta (anada = null) o edición. */
function FormularioAnada({
  productoId,
  esVino,
  anada,
  alTerminar,
}: {
  productoId: string;
  esVino: boolean;
  anada: AnadaAdmin | null;
  alTerminar?: () => void;
}) {
  const [estado, accion, enviando] = useActionState<EstadoAnada, FormData>(async (previo, datos) => {
    const nuevo = await guardarAnada(productoId, anada?.id ?? null, previo, datos);
    if (nuevo.guardados > previo.guardados) alTerminar?.();
    return nuevo;
  }, sinErrores);
  const [tipo, setTipo] = useState(anada?.tipo ?? (esVino ? "con_anio" : "sin_anada"));
  const e = estado.errores;
  const sufijo = anada?.id ?? "nueva";

  return (
    <form
      action={accion}
      aria-label={anada ? undefined : esVino ? t.agregarAnada : t.agregarPresentacion}
      key={estado.guardados}
      noValidate
      className="grid items-start gap-3 md:grid-cols-[repeat(5,minmax(0,1fr))_auto]"
    >
      {esVino ? (
        <Campo nombre="tipo" etiqueta={t.tipoAnada} error={e.tipo} idError={`error-tipo-${sufijo}`}>
          {(p) => (
            <select {...p} value={tipo} onChange={(ev) => setTipo(ev.target.value as typeof tipo)}>
              {(Object.keys(t.tiposAnada) as (keyof typeof t.tiposAnada)[]).map((k) => (
                <option key={k} value={k}>
                  {t.tiposAnada[k]}
                </option>
              ))}
            </select>
          )}
        </Campo>
      ) : (
        <input type="hidden" name="tipo" value="sin_anada" />
      )}
      {esVino && tipo === "con_anio" && (
        <Campo nombre="anio" etiqueta={t.anio} error={e.anio} idError={`error-anio-${sufijo}`}>
          {(p) => <input {...p} inputMode="numeric" defaultValue={anada?.anio ?? ""} />}
        </Campo>
      )}
      <Campo nombre="codigoTango" etiqueta={t.codigoTango} error={e.codigoTango} idError={`error-codigo-${sufijo}`}>
        {(p) => <input {...p} defaultValue={anada?.codigo_tango ?? ""} autoComplete="off" />}
      </Campo>
      <Campo nombre="descripcionTango" etiqueta={t.descripcionTango} idError={`error-desc-${sufijo}`}>
        {(p) => <input {...p} defaultValue={anada?.descripcion_tango ?? ""} autoComplete="off" />}
      </Campo>
      <Campo nombre="precio" etiqueta={t.precio} error={e.precio} idError={`error-precio-${sufijo}`}>
        {(p) => (
          <input
            {...p}
            inputMode="decimal"
            placeholder={t.precioAyuda}
            defaultValue={anada?.precio != null ? numero.format(anada.precio) : ""}
          />
        )}
      </Campo>
      <div className="flex flex-wrap items-center gap-2 self-end">
        {!anada && (
          <label className="flex min-h-11 items-center gap-2">
            <input type="checkbox" name="enStock" defaultChecked className="size-5 accent-dorado" />
            <span>{t.disponibleAlAgregar}</span>
          </label>
        )}
        <button type="submit" disabled={enviando} className={botonPrincipal}>
          {anada ? t.guardar : t.agregar}
        </button>
        {anada && (
          <button type="button" onClick={alTerminar} className={botonSecundario}>
            {t.cancelar}
          </button>
        )}
      </div>
      {estado.error && (
        <p role="alert" className="text-destacado md:col-span-6">
          {estado.error}
        </p>
      )}
    </form>
  );
}

function FilaAnada({ productoId, esVino, anada }: { productoId: string; esVino: boolean; anada: AnadaAdmin }) {
  const [modo, setModo] = useState<"ver" | "editar" | "borrar">("ver");
  const [error, setError] = useState<string | null>(null);
  const [borrando, iniciar] = useTransition();
  const etiqueta = etiquetaAnada(anada);

  if (modo === "editar") {
    return (
      <tr>
        <td colSpan={5} className="py-3">
          <span className="sr-only">{anada.codigo_tango}</span>
          <FormularioAnada productoId={productoId} esVino={esVino} anada={anada} alTerminar={() => setModo("ver")} />
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="py-1 pr-4">{etiqueta}</td>
      <td className="py-1 pr-4 font-mono text-sm">{anada.codigo_tango}</td>
      <td className="py-1 pr-4 text-right tabular-nums">{formatearPrecio(anada.precio)}</td>
      <td className="py-1 pr-4">
        <InterruptorStock key={`${anada.id}-${anada.en_stock}`} anadaId={anada.id} etiqueta={etiqueta} enStock={anada.en_stock} />
      </td>
      <td className="py-1">
        {modo === "borrar" ? (
          <span className="flex flex-wrap items-center gap-2">
            <span>{t.confirmarBorrarAnada(etiqueta)}</span>
            <button
              type="button"
              disabled={borrando}
              className={botonPrincipal}
              onClick={() =>
                iniciar(async () => {
                  const r = await borrarAnada(productoId, anada.id);
                  setError(r.error);
                  if (r.error) setModo("ver");
                })
              }
            >
              {t.siBorrar}
            </button>
            <button type="button" onClick={() => setModo("ver")} className={botonSecundario}>
              {t.cancelar}
            </button>
          </span>
        ) : (
          <span className="flex gap-2">
            <button type="button" onClick={() => setModo("editar")} className={botonSecundario}>
              {t.editar}
            </button>
            <button type="button" onClick={() => setModo("borrar")} className={botonSecundario}>
              {t.borrar}
            </button>
          </span>
        )}
        {error && (
          <span role="alert" className="text-sm text-destacado">
            {error}
          </span>
        )}
      </td>
    </tr>
  );
}

export function EditorAnadas({ productoId, esVino, anadas }: { productoId: string; esVino: boolean; anadas: AnadaAdmin[] }) {
  const c = t.columnasAnadas;
  return (
    <>
      <table aria-label={t.anadas} className="mt-2 w-full border-collapse text-left">
        <thead className="border-b border-dorado/40 text-sm text-texto-suave">
          <tr>
            <th scope="col" className="py-2 pr-4">{c.anada}</th>
            <th scope="col" className="py-2 pr-4">{c.codigo}</th>
            <th scope="col" className="py-2 pr-4 text-right">{c.precio}</th>
            <th scope="col" className="py-2 pr-4">{c.stock}</th>
            <th scope="col" className="py-2">{t.acciones}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dorado/20">
          {anadas.map((anada) => (
            <FilaAnada key={anada.id} productoId={productoId} esVino={esVino} anada={anada} />
          ))}
        </tbody>
      </table>
      <h3 className="mt-6 mb-2 font-semibold text-destacado">{esVino ? t.agregarAnada : t.agregarPresentacion}</h3>
      <FormularioAnada productoId={productoId} esVino={esVino} anada={null} />
    </>
  );
}
