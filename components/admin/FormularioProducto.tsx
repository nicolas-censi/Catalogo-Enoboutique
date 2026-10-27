"use client";

import { useActionState } from "react";
import { guardarProducto, type EstadoProducto } from "@/app/admin/acciones-producto";
import { textos } from "@/lib/textos";

const t = textos.admin;
const control =
  "min-h-11 w-full rounded-md border border-dorado/60 bg-superficie px-3 text-base text-texto focus:outline-2 focus:outline-dorado aria-[invalid=true]:border-destacado";

export type ValoresProducto = {
  tipo: string;
  nombre: string;
  bodega: string;
  varietal: string;
  seccion: string;
  descripcion: string;
  visible: boolean;
};

function ErrorCampo({ id, mensaje }: { id: string; mensaje?: string }) {
  if (!mensaje) return null;
  return (
    <span id={id} className="text-sm text-destacado">
      {mensaje}
    </span>
  );
}

export function FormularioProducto({
  productoId,
  inicial,
  secciones,
  bodegas,
}: {
  productoId: string | null;
  inicial: ValoresProducto;
  secciones: { id: string; nombre: string }[];
  bodegas: string[];
}) {
  const [estado, accion, enviando] = useActionState<EstadoProducto, FormData>(guardarProducto.bind(null, productoId), {
    errores: {},
    error: null,
    guardado: false,
    valores: null,
  });
  // Después de enviar, los campos muestran lo enviado (así no se pierde si hubo errores).
  const v = estado.valores
    ? { ...inicial, ...estado.valores, visible: estado.valores.visible === "on" }
    : inicial;
  const e = estado.errores;

  return (
    <form action={accion} className="grid max-w-3xl gap-4 md:grid-cols-2" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor="producto-tipo">{t.tipo}</label>
        <select
          id="producto-tipo"
          name="tipo"
          defaultValue={v.tipo}
          key={`tipo-${v.tipo}`}
          aria-invalid={!!e.tipo}
          aria-describedby={e.tipo ? "error-tipo" : undefined}
          className={control}
        >
          <option value="">{t.elegir}</option>
          {(Object.keys(t.tipos) as (keyof typeof t.tipos)[]).map((tipo) => (
            <option key={tipo} value={tipo}>
              {t.tipos[tipo]}
            </option>
          ))}
        </select>
        <ErrorCampo id="error-tipo" mensaje={e.tipo} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="producto-nombre">{t.nombre}</label>
        <input
          id="producto-nombre"
          name="nombre"
          defaultValue={v.nombre}
          aria-invalid={!!e.nombre}
          aria-describedby={e.nombre ? "error-nombre" : undefined}
          className={control}
        />
        <ErrorCampo id="error-nombre" mensaje={e.nombre} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="producto-bodega">{t.bodega}</label>
        <input id="producto-bodega" name="bodega" defaultValue={v.bodega} list="bodegas" autoComplete="off" placeholder={t.bodegaAyuda} className={control} />
        <datalist id="bodegas">
          {bodegas.map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="producto-varietal">{t.varietal}</label>
        <input id="producto-varietal" name="varietal" defaultValue={v.varietal} className={control} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="producto-seccion">{t.seccion}</label>
        <select id="producto-seccion" name="seccion" defaultValue={v.seccion} key={`seccion-${v.seccion}`} className={control}>
          <option value="">{t.sinSeccionOpcion}</option>
          {secciones.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
      </div>
      <label className="flex min-h-11 items-center gap-3 self-end">
        <input type="checkbox" name="visible" defaultChecked={v.visible} key={`visible-${v.visible}`} className="size-5 accent-dorado" />
        <span>{t.visibleEnCarta}</span>
      </label>
      <div className="flex flex-col gap-1 md:col-span-2">
        <label htmlFor="producto-descripcion">{t.descripcion}</label>
        <textarea id="producto-descripcion" name="descripcion" defaultValue={v.descripcion} rows={4} className={`${control} py-2`} />
      </div>
      <div className="flex items-center gap-4 md:col-span-2">
        <button type="submit" disabled={enviando} className="min-h-11 rounded-md bg-boton px-6 font-semibold text-boton-texto disabled:opacity-60">
          {enviando ? t.guardando : t.guardar}
        </button>
        {estado.error && (
          <p role="alert" className="text-destacado">
            {estado.error}
          </p>
        )}
        {estado.guardado && !enviando && <p role="status">{t.cambiosGuardados}</p>}
      </div>
    </form>
  );
}
