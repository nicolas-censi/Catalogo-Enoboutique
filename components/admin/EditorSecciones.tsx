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
import { claseBoton } from "@/components/admin/ui/boton";
import { Confirmar } from "@/components/admin/ui/Confirmar";
import { MenuAcciones } from "@/components/admin/ui/MenuAcciones";
import type { SeccionAdmin } from "@/lib/admin/secciones";
import { textos } from "@/lib/textos";

const t = textos.admin;
const control =
  "min-h-11 rounded-md border border-control bg-superficie px-3 text-base text-texto focus:outline-2 focus:outline-texto aria-[invalid=true]:border-error";
const principal = claseBoton("principal");


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
          visible ? "border-texto bg-texto text-boton-texto" : "border-control text-texto-suave"
        }`}
      >
        {visible ? t.visible : t.oculta}
      </button>
      {error && (
        <span role="alert" className="text-sm text-error">
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
    <li ref={ref} style={estilo} className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-2 py-2 md:px-3 ${arrastrando ? "bg-fondo shadow-lg" : ""}`}>
      <ManijaOrdenable manija={manija} />
      {modo === "renombrar" ? (
        <form
          className="flex min-w-0 flex-1 flex-wrap gap-2"
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
          <input id={`renombrar-${seccion.id}`} value={nombre} onChange={(e) => setNombre(e.target.value)} className={`${control} min-w-0 flex-1`} autoFocus />
          <button type="submit" disabled={ocupado} className={claseBoton("principal")}>
            {t.guardar}
          </button>
          <button type="button" onClick={() => setModo("ver")} className={claseBoton("secundario")}>
            {t.cancelar}
          </button>
        </form>
      ) : (
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3">
          <Link href={`/admin/secciones/${seccion.id}`} className="inline-flex min-h-11 min-w-11 items-center truncate font-semibold underline-offset-4 hover:underline">
            {seccion.nombre}
          </Link>
          <span className="text-sm text-texto-suave">
            {seccion.subsecciones > 0 ? t.cantidadSubsecciones(seccion.subsecciones) : t.cantidadProductos(seccion.productos)}
          </span>
        </span>
      )}
      {modo !== "renombrar" && (
        <>
          <InterruptorVisible seccion={seccion} />
          <MenuAcciones
            etiqueta={t.ui.masAcciones(seccion.nombre)}
            acciones={[
              { etiqueta: t.renombrar, alElegir: () => setModo("renombrar") },
              { etiqueta: t.borrar, peligro: true, alElegir: pedirBorrar },
            ]}
          />
        </>
      )}
      {error && (
        <span role="alert" className="basis-full pl-14 text-sm text-error">
          {error}
        </span>
      )}
      <Confirmar
        abierto={modo === "borrar"}
        titulo={t.confirmarBorrarSeccion(seccion.nombre)}
        confirmar={t.siBorrar}
        ocupado={ocupado}
        alCancelar={() => setModo("ver")}
        alConfirmar={() =>
          iniciar(async () => {
            const r = await borrarSeccion(seccion.id);
            setError(r.error);
            if (r.error) setModo("ver");
          })
        }
      />
    </li>
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
  return (
    <>
      <p className="mb-4 max-w-prose text-texto-suave">{padre ? t.ordenSubsecciones : t.ordenSecciones}</p>
      {padre && secciones.length === 0 && <p className="mb-4">{t.sinSubsecciones}</p>}
      <Ordenable items={secciones} onCambio={ordenarSecciones}>
        {(ordenadas) => (
          <ul aria-label={padre ? t.subsecciones : t.secciones} className="divide-y divide-linea rounded-xl border border-linea bg-superficie empty:hidden">
            {ordenadas.map((s) => (
              <FilaSeccion key={`${s.id}-${s.nombre}-${s.visible}`} seccion={s} />
            ))}
          </ul>
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
          <span id="error-seccion-nueva" className="basis-full text-sm text-error">
            {estado.errorCampo}
          </span>
        )}
        {estado.error && (
          <p role="alert" className="basis-full text-error">
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
