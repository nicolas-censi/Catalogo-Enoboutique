"use client";

import { useActionState, useState, useTransition } from "react";
import { cambiarRol, darDeBaja, invitarPersona, type EstadoInvitacion } from "@/app/admin/acciones-personal";
import type { Rol } from "@/lib/admin/sesion";
import { textos } from "@/lib/textos";

const t = textos.admin;
const control =
  "min-h-11 rounded-md border border-dorado/60 bg-superficie px-3 text-base text-texto focus:outline-2 focus:outline-dorado aria-[invalid=true]:border-destacado disabled:opacity-60";
const secundario = "inline-flex min-h-11 items-center rounded-md border border-dorado/60 px-4";
const principal = "inline-flex min-h-11 items-center rounded-md bg-boton px-5 font-semibold text-boton-texto disabled:opacity-60";
const ROLES: Rol[] = ["encargado", "vendedor"];

export type Persona = { id: string; email: string; rol: Rol; activa: boolean; soyYo: boolean };

function FilaPersona({ persona }: { persona: Persona }) {
  const [confirmando, setConfirmando] = useState(false);
  const [mensaje, setMensaje] = useState<{ error: string | null; guardado: boolean }>({ error: null, guardado: false });
  const [ocupado, iniciar] = useTransition();

  return (
    <tr>
      <td data-etiqueta={t.columnasPersonal.email} className="py-1 pr-4 break-all">
        {persona.email} {persona.soyYo && <span className="text-texto-suave">{t.vos}</span>}
      </td>
      <td data-etiqueta={t.columnasPersonal.rol} className="py-1 pr-4">
        <select
          aria-label={t.rolDe(persona.email)}
          defaultValue={persona.rol}
          disabled={persona.soyYo || ocupado}
          onChange={(e) =>
            iniciar(async () => {
              const r = await cambiarRol(persona.id, e.target.value as Rol);
              setMensaje({ error: r.error, guardado: !r.error });
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
        {mensaje.guardado && <span role="status" className="ml-2 text-sm text-texto-suave">{t.guardado}</span>}
      </td>
      <td data-etiqueta={t.columnasPersonal.estado} className="py-1 pr-4">{persona.activa ? t.activa : t.invitacionPendiente}</td>
      <td data-etiqueta={t.acciones} className="py-1">
        {!persona.soyYo &&
          (confirmando ? (
            <span className="flex flex-wrap items-center gap-2">
              <span>{t.confirmarBaja(persona.email)}</span>
              <button
                type="button"
                disabled={ocupado}
                className={principal}
                onClick={() =>
                  iniciar(async () => {
                    const r = await darDeBaja(persona.id);
                    setMensaje({ error: r.error, guardado: false });
                    if (r.error) setConfirmando(false);
                  })
                }
              >
                {t.siDarDeBaja}
              </button>
              <button type="button" onClick={() => setConfirmando(false)} className={secundario}>
                {t.cancelar}
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmando(true)} className={secundario}>
              {t.darDeBaja}
            </button>
          ))}
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
  const [estado, accion, enviando] = useActionState<EstadoInvitacion, FormData>(invitarPersona, {
    errorEmail: null,
    error: null,
    enviadoA: null,
    enviados: 0,
  });
  const c = t.columnasPersonal;
  return (
    <>
      <p className="mb-4 text-texto-suave">{t.personalAyuda}</p>
      <table aria-label={t.personal} className="tabla-responsiva w-full border-collapse text-left">
        <thead className="border-b border-dorado/40 text-sm text-texto-suave">
          <tr>
            <th scope="col" className="py-2 pr-4">{c.email}</th>
            <th scope="col" className="py-2 pr-4">{c.rol}</th>
            <th scope="col" className="py-2 pr-4">{c.estado}</th>
            <th scope="col" className="py-2">{t.acciones}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dorado/20">
          {personas.map((p) => (
            <FilaPersona key={`${p.id}-${p.activa}`} persona={p} />
          ))}
        </tbody>
      </table>
      <form action={accion} key={estado.enviados} noValidate className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="invitar-email" className="text-sm text-texto-suave">{t.emailPersona}</label>
          <input
            id="invitar-email"
            type="email"
            name="email"
            autoComplete="off"
            aria-invalid={!!estado.errorEmail}
            aria-describedby={estado.errorEmail ? "error-invitar-email" : undefined}
            className={`${control} w-72`}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="invitar-rol" className="text-sm text-texto-suave">{t.rol}</label>
          <select id="invitar-rol" name="rol" defaultValue="vendedor" className={control}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {t.roles[r]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={enviando} className={principal}>
          {t.invitar}
        </button>
        {estado.errorEmail && (
          <span id="error-invitar-email" className="basis-full text-sm text-destacado">{estado.errorEmail}</span>
        )}
        {estado.error && <p role="alert" className="basis-full text-destacado">{estado.error}</p>}
      </form>
      {estado.enviadoA && <p role="status" className="mt-3">{t.invitacionEnviada(estado.enviadoA)}</p>}
    </>
  );
}
