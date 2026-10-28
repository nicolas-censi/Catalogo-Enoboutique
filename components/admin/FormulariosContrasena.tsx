"use client";

import { useActionState } from "react";
import { guardarContrasena, type EstadoContrasena } from "@/app/admin/acciones-contrasena";
import { textos } from "@/lib/textos";

const t = textos.admin;
const control =
  "min-h-11 w-full rounded-md border border-dorado/60 bg-superficie px-3 text-base text-texto focus:outline-2 focus:outline-dorado aria-[invalid=true]:border-destacado";
const boton = "min-h-11 rounded-md bg-boton px-5 font-semibold text-boton-texto disabled:opacity-60";

export function FormularioElegirContrasena() {
  const [estado, accion, enviando] = useActionState<EstadoContrasena, FormData>(guardarContrasena, {
    errores: {},
    error: null,
  });
  const e = estado.errores;
  return (
    <form action={accion} noValidate className="mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="contrasena-nueva">{t.contrasenaNueva}</label>
        <input
          id="contrasena-nueva"
          type="password"
          name="nueva"
          autoComplete="new-password"
          aria-invalid={!!e.nueva}
          aria-describedby={e.nueva ? "error-contrasena-nueva" : undefined}
          className={control}
        />
        {e.nueva && <span id="error-contrasena-nueva" className="text-sm text-destacado">{e.nueva}</span>}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="contrasena-repetida">{t.repetirContrasena}</label>
        <input
          id="contrasena-repetida"
          type="password"
          name="repetida"
          autoComplete="new-password"
          aria-invalid={!!e.repetida}
          aria-describedby={e.repetida ? "error-contrasena-repetida" : undefined}
          className={control}
        />
        {e.repetida && <span id="error-contrasena-repetida" className="text-sm text-destacado">{e.repetida}</span>}
      </div>
      {estado.error && <p role="alert" className="text-destacado">{estado.error}</p>}
      <button type="submit" disabled={enviando} className={boton}>
        {t.guardarContrasena}
      </button>
    </form>
  );
}
