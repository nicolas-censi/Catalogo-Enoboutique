"use client";

import { useActionState, useState, useTransition } from "react";
import { borrarAnada, guardarAnada, type EstadoAnada } from "@/app/admin/acciones-anadas";
import { InterruptorStock } from "@/components/admin/InterruptorStock";
import { claseBoton } from "@/components/admin/ui/boton";
import { Confirmar } from "@/components/admin/ui/Confirmar";
import { MenuAcciones } from "@/components/admin/ui/MenuAcciones";
import type { AnadaAdmin } from "@/lib/admin/productos";
import { formatearPrecio } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.admin;
const control =
  "min-h-11 w-full rounded-md border border-control bg-superficie px-3 text-base text-texto focus:outline-2 focus:outline-texto aria-[invalid=true]:border-error";
const botonSecundario = claseBoton("secundario");
const botonPrincipal = claseBoton("principal");
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
        <span id={idError} className="text-sm text-error">
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
            <input type="checkbox" name="enStock" defaultChecked className="size-5 accent-texto" />
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
        <p role="alert" className="text-error md:col-span-6">
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
      <li className="px-3 py-3 md:px-4">
        <span className="sr-only">{anada.codigo_tango}</span>
        <FormularioAnada productoId={productoId} esVino={esVino} anada={anada} alTerminar={() => setModo("ver")} />
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 md:px-4">
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{etiqueta}</span>
        <span className="block font-mono text-sm text-texto-suave">{anada.codigo_tango}</span>
      </span>
      <span className="tabular-nums">{formatearPrecio(anada.precio)}</span>
      <InterruptorStock key={`${anada.id}-${anada.en_stock}`} anadaId={anada.id} etiqueta={etiqueta} enStock={anada.en_stock} />
      <MenuAcciones
        etiqueta={t.ui.masAcciones(etiqueta)}
        acciones={[
          { etiqueta: t.editar, alElegir: () => setModo("editar") },
          { etiqueta: t.borrar, peligro: true, alElegir: () => setModo("borrar") },
        ]}
      />
      {error && (
        <span role="alert" className="basis-full text-sm text-error">
          {error}
        </span>
      )}
      <Confirmar
        abierto={modo === "borrar"}
        titulo={t.confirmarBorrarAnada(etiqueta)}
        confirmar={t.siBorrar}
        ocupado={borrando}
        alCancelar={() => setModo("ver")}
        alConfirmar={() =>
          iniciar(async () => {
            const r = await borrarAnada(productoId, anada.id);
            setError(r.error);
            if (r.error) setModo("ver");
          })
        }
      />
    </li>
  );
}

export function EditorAnadas({ productoId, esVino, anadas }: { productoId: string; esVino: boolean; anadas: AnadaAdmin[] }) {
  return (
    <>
      <ul aria-label={t.anadas} className="divide-y divide-linea rounded-xl border border-linea bg-superficie empty:hidden">
        {anadas.map((anada) => (
          <FilaAnada key={anada.id} productoId={productoId} esVino={esVino} anada={anada} />
        ))}
      </ul>
      <h3 className="mt-8 mb-3 font-semibold">{esVino ? t.agregarAnada : t.agregarPresentacion}</h3>
      <FormularioAnada productoId={productoId} esVino={esVino} anada={null} />
    </>
  );
}
