"use client";

import Link from "next/link";
import { useActionState, useOptimistic, useState, useTransition } from "react";
import {
  borrarSeccion,
  cambiarVisibilidadSeccion,
  crearSeccion,
  ordenarSecciones,
  renombrarSeccion,
  type EstadoSeccion,
} from "@/app/admin/acciones-secciones";
import { ManijaOrdenable, Ordenable, useElementoOrdenable } from "@/components/admin/Ordenable";
import type { SeccionAdmin } from "@/lib/admin/secciones";
import { textos } from "@/lib/textos";

const t = textos.admin;
const control =
  "min-h-11 rounded-md border border-dorado/60 bg-superficie px-3 text-base text-texto focus:outline-2 focus:outline-dorado aria-[invalid=true]:border-destacado";
const secundario = "inline-flex min-h-11 items-center rounded-md border border-dorado/60 px-4";
const principal = "inline-flex min-h-11 items-center rounded-md bg-boton px-5 font-semibold text-boton-texto disabled:opacity-60";


function InterruptorVisible({ seccion }: { seccion: SeccionAdmin }) {
  const [guardado, setGuardado] = useState(seccion.visible);
  const [visible, setVisible] = useOptimistic(guardado);
  const [error, setError] = useState<string | null>(null);
  const [, iniciar] = useTransition();
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={visible}
        aria-label={t.visibleDe(seccion.nombre)}
        onClick={() =>
          iniciar(async () => {
            const nuevo = !visible;
            setVisible(nuevo);
            const r = await cambiarVisibilidadSeccion(seccion.id, nuevo);
            setError(r.error);
            if (!r.error) setGuardado(nuevo);
          })
        }
        className={`inline-flex min-h-11 min-w-28 items-center justify-center rounded-full border px-4 font-semibold ${
          visible ? "border-dorado bg-dorado text-boton-texto" : "border-dorado/60 text-texto-suave"
        }`}
      >
        {visible ? t.visible : t.oculta}
      </button>
      {error && (
        <span role="alert" className="text-sm text-destacado">
          {error}
        </span>
      )}
    </span>
  );
}

function FilaSeccion({ seccion }: { seccion: SeccionAdmin }) {
  const [modo, setModo] = useState<"ver" | "renombrar" | "borrar">("ver");
  const [nombre, setNombre] = useState(seccion.nombre);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();
  const { ref, estilo, arrastrando, manija } = useElementoOrdenable(seccion.id, seccion.nombre);

  function pedirBorrar() {
    // Con subsecciones o productos no se puede: se avisa sin preguntar.
    if (seccion.subsecciones > 0) return setError(t.noBorrarConSubsecciones(seccion.subsecciones));
    if (seccion.productos > 0) return setError(t.noBorrarSeccion(seccion.productos));
    setError(null);
    setModo("borrar");
  }

  return (
    <tr ref={ref} style={estilo} className={arrastrando ? "bg-superficie shadow-lg" : undefined}>
      <td data-etiqueta={t.columnasSecciones.orden} className="py-1 pr-4">
        <ManijaOrdenable manija={manija} />
      </td>
      <td data-etiqueta={t.columnasSecciones.seccion} className="py-1 pr-4">
        {modo === "renombrar" ? (
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              iniciar(async () => {
                const r = await renombrarSeccion(seccion.id, nombre);
                setError(r.error);
                if (!r.error) setModo("ver");
              });
            }}
          >
            <label htmlFor={`renombrar-${seccion.id}`} className="sr-only">
              {t.nombre}
            </label>
            <input id={`renombrar-${seccion.id}`} value={nombre} onChange={(e) => setNombre(e.target.value)} className={control} autoFocus />
            <button type="submit" disabled={ocupado} className={principal}>
              {t.guardar}
            </button>
            <button type="button" onClick={() => setModo("ver")} className={secundario}>
              {t.cancelar}
            </button>
          </form>
        ) : (
          <Link href={`/admin/secciones/${seccion.id}`} className="inline-flex min-h-11 min-w-11 items-center text-titulo underline-offset-4 hover:underline">
            {seccion.nombre}
          </Link>
        )}
      </td>
      <td data-etiqueta={t.columnasSecciones.productos} className="py-1 pr-4 text-texto-suave">
        {seccion.subsecciones > 0 ? t.cantidadSubsecciones(seccion.subsecciones) : t.cantidadProductos(seccion.productos)}
      </td>
      <td data-etiqueta={t.columnasSecciones.visible} className="py-1 pr-4">
        <InterruptorVisible seccion={seccion} />
      </td>
      <td data-etiqueta={t.acciones} className="py-1">
        {modo === "borrar" ? (
          <span className="flex flex-wrap items-center gap-2">
            <span>{t.confirmarBorrarSeccion(seccion.nombre)}</span>
            <button
              type="button"
              disabled={ocupado}
              className={principal}
              onClick={() =>
                iniciar(async () => {
                  const r = await borrarSeccion(seccion.id);
                  setError(r.error);
                  if (r.error) setModo("ver");
                })
              }
            >
              {t.siBorrar}
            </button>
            <button type="button" onClick={() => setModo("ver")} className={secundario}>
              {t.cancelar}
            </button>
          </span>
        ) : (
          modo === "ver" && (
            <span className="flex gap-2">
              <button type="button" onClick={() => setModo("renombrar")} className={secundario}>
                {t.renombrar}
              </button>
              <button type="button" onClick={pedirBorrar} className={secundario}>
                {t.borrar}
              </button>
            </span>
          )
        )}
        {error && (
          <span role="alert" className="mt-1 block text-sm text-destacado">
            {error}
          </span>
        )}
      </td>
    </tr>
  );
}

/** Secciones de primer nivel o, con `padre`, las subsecciones de esa sección (spec 011). */
export function EditorSecciones({ secciones, padre }: { secciones: SeccionAdmin[]; padre?: string }) {
  const [estado, accion, enviando] = useActionState<EstadoSeccion, FormData>(crearSeccion, {
    errorCampo: null,
    error: null,
    aviso: null,
    guardados: 0,
  });
  const c = t.columnasSecciones;
  return (
    <>
      <p className="mb-4 max-w-prose text-texto-suave">{padre ? t.ordenSubsecciones : t.ordenSecciones}</p>
      {padre && secciones.length === 0 && <p className="mb-4">{t.sinSubsecciones}</p>}
      <Ordenable items={secciones} onCambio={ordenarSecciones}>
        {(ordenadas) => (
          <table aria-label={padre ? t.subsecciones : t.secciones} className="tabla-responsiva w-full border-collapse text-left">
            <thead className="border-b border-dorado/40 text-sm text-texto-suave">
              <tr>
                <th scope="col" className="py-2 pr-4">{c.orden}</th>
                <th scope="col" className="py-2 pr-4">{c.seccion}</th>
                <th scope="col" className="py-2 pr-4">{c.productos}</th>
                <th scope="col" className="py-2 pr-4">{c.visible}</th>
                <th scope="col" className="py-2">{t.acciones}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dorado/20">
              {ordenadas.map((s) => (
                <FilaSeccion key={`${s.id}-${s.nombre}-${s.visible}`} seccion={s} />
              ))}
            </tbody>
          </table>
        )}
      </Ordenable>
      <form action={accion} key={estado.guardados} noValidate className="mt-6 flex flex-wrap items-end gap-3">
        {padre && <input type="hidden" name="padre" value={padre} />}
        <div className="flex flex-col gap-1">
          <label htmlFor="seccion-nueva" className="text-sm text-texto-suave">
            {padre ? t.nombreSubseccionNueva : t.nombreSeccionNueva}
          </label>
          <input
            id="seccion-nueva"
            name="nombre"
            aria-invalid={!!estado.errorCampo}
            aria-describedby={estado.errorCampo ? "error-seccion-nueva" : undefined}
            className={`${control} w-72`}
          />
        </div>
        <button type="submit" disabled={enviando} className={principal}>
          {padre ? t.crearSubseccion : t.crearSeccion}
        </button>
        {estado.errorCampo && (
          <span id="error-seccion-nueva" className="basis-full text-sm text-destacado">
            {estado.errorCampo}
          </span>
        )}
        {estado.error && (
          <p role="alert" className="basis-full text-destacado">
            {estado.error}
          </p>
        )}
      </form>
      {estado.aviso && (
        <p role="status" className="mt-3">
          {estado.aviso}
        </p>
      )}
    </>
  );
}
