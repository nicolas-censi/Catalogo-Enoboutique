"use client";

import { useActionState, useState, useTransition } from "react";
import { cambiarContrasena, cambiarRol, darDeAlta, darDeBaja, type EstadoAlta } from "@/app/admin/acciones-personal";
import type { Rol } from "@/lib/admin/sesion";
import { textos } from "@/lib/textos";
import { Confirmar } from "@/components/admin/ui/Confirmar";
import { MenuAcciones } from "@/components/admin/ui/MenuAcciones";

const t = textos.admin;
const control =
  "min-h-11 rounded-md border border-control bg-superficie px-3 text-base text-texto focus:outline-2 focus:outline-texto aria-[invalid=true]:border-destacado disabled:opacity-60";
const secundario = "inline-flex min-h-11 items-center rounded-md border border-control px-4";
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
        <span id={`${id}-error`} className="basis-full text-sm text-error">
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
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 md:px-4">
      <span className="min-w-0 flex-1 font-semibold break-all">
        {persona.usuario} {persona.soyYo && <span className="font-normal text-texto-suave">{t.vos}</span>}
      </span>
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
      <MenuAcciones
        etiqueta={t.ui.masAcciones(persona.usuario)}
        acciones={[
          {
            etiqueta: t.cambiarContrasena,
            alElegir: () => {
              setMensaje({ error: null, guardado: null });
              setModo("contrasena");
            },
          },
          ...(persona.soyYo ? [] : [{ etiqueta: t.darDeBaja, peligro: true, alElegir: () => setModo("baja") }]),
        ]}
      />
      {modo === "contrasena" && (
        <div className="basis-full">
          <CambiarContrasena
            persona={persona}
            onListo={(m) => {
              setMensaje(m);
              setModo("ver");
            }}
          />
        </div>
      )}
      {mensaje.guardado && (
        <span role="status" className="basis-full text-sm text-texto-suave">
          {mensaje.guardado}
        </span>
      )}
      {mensaje.error && (
        <span role="alert" className="basis-full text-sm text-error">
          {mensaje.error}
        </span>
      )}
      <Confirmar
        abierto={modo === "baja"}
        titulo={t.confirmarBaja(persona.usuario)}
        confirmar={t.siDarDeBaja}
        ocupado={ocupado}
        alCancelar={() => setModo("ver")}
        alConfirmar={() =>
          iniciar(async () => {
            const r = await darDeBaja(persona.id);
            setMensaje({ error: r.error, guardado: null });
            if (r.error) setModo("ver");
          })
        }
      />
    </li>
  );
}

export function EditorPersonal({ personas }: { personas: Persona[] }) {
  const [estado, accion, enviando] = useActionState<EstadoAlta, FormData>(darDeAlta, {
    errores: {},
    error: null,
    creado: null,
    creados: 0,
  });
  const e = estado.errores;
  return (
    <>
      <p className="mb-4 text-texto-suave">{t.personalAyuda}</p>
      <ul aria-label={t.personal} className="divide-y divide-linea rounded-xl border border-linea bg-superficie">
        {personas.map((p) => (
          <FilaPersona key={p.id} persona={p} />
        ))}
      </ul>
      <h2 className="mt-8 mb-3 text-lg font-semibold">{t.altaPersonal}</h2>
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
          {e.usuario && <span id="error-alta-usuario" className="max-w-56 text-sm text-error">{e.usuario}</span>}
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
          {e.contrasena && <span id="error-alta-contrasena" className="max-w-44 text-sm text-error">{e.contrasena}</span>}
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
        {estado.error && <p role="alert" className="basis-full text-error">{estado.error}</p>}
      </form>
      {estado.creado && <p role="status" className="mt-3">{t.altaLista(estado.creado)}</p>}
    </>
  );
}
