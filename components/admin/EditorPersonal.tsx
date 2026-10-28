"use client";

import { useActionState, useState, useTransition } from "react";
import { cambiarContrasena, cambiarRol, darDeAlta, darDeBaja, type EstadoAlta } from "@/app/admin/acciones-personal";
import type { Rol } from "@/lib/admin/sesion";
import { textos } from "@/lib/textos";

const t = textos.admin;
const control =
  "min-h-11 rounded-md border border-dorado/60 bg-superficie px-3 text-base text-texto focus:outline-2 focus:outline-dorado aria-[invalid=true]:border-destacado disabled:opacity-60";
const secundario = "inline-flex min-h-11 items-center rounded-md border border-dorado/60 px-4";
const principal = "inline-flex min-h-11 items-center rounded-md bg-boton px-5 font-semibold text-boton-texto disabled:opacity-60";
const ROLES: Rol[] = ["encargado", "vendedor"];

export type Persona = { id: string; usuario: string; rol: Rol; soyYo: boolean };

type Mensaje = { error: string | null; guardado: string | null };

function CambiarContrasena({ persona, onListo }: { persona: Persona; onListo: (m: Mensaje) => void }) {
  const [contrasena, setContrasena] = useState("");
  const [errorCampo, setErrorCampo] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();
  const id = `contrasena-${persona.id}`;
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        iniciar(async () => {
          const r = await cambiarContrasena(persona.id, contrasena);
          setErrorCampo(r.errorCampo);
          if (!r.errorCampo) onListo({ error: r.error, guardado: r.error ? null : t.contrasenaCambiada });
        });
      }}
    >
      <label htmlFor={id} className="sr-only">
        {t.contrasenaNuevaDe(persona.usuario)}
      </label>
      <input
        id={id}
        value={contrasena}
        onChange={(e) => setContrasena(e.target.value)}
        autoComplete="new-password"
        aria-invalid={!!errorCampo}
        aria-describedby={errorCampo ? `${id}-error` : undefined}
        className={`${control} w-44`}
        autoFocus
      />
      <button type="submit" disabled={ocupado} className={principal}>
        {t.guardar}
      </button>
      <button type="button" onClick={() => onListo({ error: null, guardado: null })} className={secundario}>
        {t.cancelar}
      </button>
      {errorCampo && (
        <span id={`${id}-error`} className="basis-full text-sm text-destacado">
          {errorCampo}
        </span>
      )}
    </form>
  );
}

function FilaPersona({ persona }: { persona: Persona }) {
  const [modo, setModo] = useState<"ver" | "contrasena" | "baja">("ver");
  const [mensaje, setMensaje] = useState<Mensaje>({ error: null, guardado: null });
  const [ocupado, iniciar] = useTransition();

  return (
    <tr>
      <td data-etiqueta={t.columnasPersonal.usuario} className="py-1 pr-4 break-all">
        {persona.usuario} {persona.soyYo && <span className="text-texto-suave">{t.vos}</span>}
      </td>
      <td data-etiqueta={t.columnasPersonal.rol} className="py-1 pr-4">
        <select
          aria-label={t.rolDe(persona.usuario)}
          defaultValue={persona.rol}
          disabled={persona.soyYo || ocupado}
          onChange={(e) =>
            iniciar(async () => {
              const r = await cambiarRol(persona.id, e.target.value as Rol);
              setMensaje({ error: r.error, guardado: r.error ? null : t.guardado });
            })
          }
          className={control}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {t.roles[r]}
            </option>
          ))}
        </select>
      </td>
      <td data-etiqueta={t.acciones} className="py-1">
        {modo === "contrasena" && (
          <CambiarContrasena
            persona={persona}
            onListo={(m) => {
              setMensaje(m);
              setModo("ver");
            }}
          />
        )}
        {modo === "baja" && (
          <span className="flex flex-wrap items-center gap-2">
            <span>{t.confirmarBaja(persona.usuario)}</span>
            <button
              type="button"
              disabled={ocupado}
              className={principal}
              onClick={() =>
                iniciar(async () => {
                  const r = await darDeBaja(persona.id);
                  setMensaje({ error: r.error, guardado: null });
                  if (r.error) setModo("ver");
                })
              }
            >
              {t.siDarDeBaja}
            </button>
            <button type="button" onClick={() => setModo("ver")} className={secundario}>
              {t.cancelar}
            </button>
          </span>
        )}
        {modo === "ver" && (
          <span className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setMensaje({ error: null, guardado: null });
                setModo("contrasena");
              }}
              className={secundario}
            >
              {t.cambiarContrasena}
            </button>
            {!persona.soyYo && (
              <button type="button" onClick={() => setModo("baja")} className={secundario}>
                {t.darDeBaja}
              </button>
            )}
          </span>
        )}
        {mensaje.guardado && (
          <span role="status" className="mt-1 block text-sm text-texto-suave">
            {mensaje.guardado}
          </span>
        )}
        {mensaje.error && (
          <span role="alert" className="mt-1 block text-sm text-destacado">
            {mensaje.error}
          </span>
        )}
      </td>
    </tr>
  );
}

export function EditorPersonal({ personas }: { personas: Persona[] }) {
  const [estado, accion, enviando] = useActionState<EstadoAlta, FormData>(darDeAlta, {
    errores: {},
    error: null,
    creado: null,
    creados: 0,
  });
  const c = t.columnasPersonal;
  const e = estado.errores;
  return (
    <>
      <p className="mb-4 text-texto-suave">{t.personalAyuda}</p>
      <table aria-label={t.personal} className="tabla-responsiva w-full border-collapse text-left">
        <thead className="border-b border-dorado/40 text-sm text-texto-suave">
          <tr>
            <th scope="col" className="py-2 pr-4">{c.usuario}</th>
            <th scope="col" className="py-2 pr-4">{c.rol}</th>
            <th scope="col" className="py-2">{t.acciones}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dorado/20">
          {personas.map((p) => (
            <FilaPersona key={p.id} persona={p} />
          ))}
        </tbody>
      </table>
      <h2 className="mt-8 mb-3 text-lg font-semibold text-destacado">{t.altaPersonal}</h2>
      <form action={accion} key={estado.creados} noValidate className="flex flex-wrap items-start gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="alta-usuario" className="text-sm text-texto-suave">{t.usuario}</label>
          <input
            id="alta-usuario"
            name="usuario"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={!!e.usuario}
            aria-describedby={e.usuario ? "error-alta-usuario" : undefined}
            className={`${control} w-56`}
          />
          {e.usuario && <span id="error-alta-usuario" className="max-w-56 text-sm text-destacado">{e.usuario}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="alta-contrasena" className="text-sm text-texto-suave">{t.contrasena}</label>
          {/* Se ve lo que se escribe: el encargado se la pasa a la persona. */}
          <input
            id="alta-contrasena"
            name="contrasena"
            autoComplete="new-password"
            aria-invalid={!!e.contrasena}
            aria-describedby={e.contrasena ? "error-alta-contrasena" : undefined}
            className={`${control} w-44`}
          />
          {e.contrasena && <span id="error-alta-contrasena" className="max-w-44 text-sm text-destacado">{e.contrasena}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="alta-rol" className="text-sm text-texto-suave">{t.rol}</label>
          <select id="alta-rol" name="rol" defaultValue="vendedor" className={control}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {t.roles[r]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={enviando} className={`${principal} mt-6`}>
          {t.darDeAltaBoton}
        </button>
        {estado.error && <p role="alert" className="basis-full text-destacado">{estado.error}</p>}
      </form>
      {estado.creado && <p role="status" className="mt-3">{t.altaLista(estado.creado)}</p>}
    </>
  );
}
