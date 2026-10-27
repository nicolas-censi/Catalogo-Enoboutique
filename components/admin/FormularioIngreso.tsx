"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ingresar, type EstadoIngreso } from "@/app/admin/acciones-sesion";
import { textos } from "@/lib/textos";

const campo =
  "min-h-11 w-full rounded-md border border-dorado/60 bg-superficie px-3 text-base text-texto focus:outline-2 focus:outline-dorado";

export function FormularioIngreso() {
  const [estado, accion, enviando] = useActionState<EstadoIngreso, FormData>(ingresar, { error: null });
  return (
    <form action={accion} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span>{textos.admin.email}</span>
        <input type="email" name="email" required autoComplete="username" className={campo} />
      </label>
      <label className="flex flex-col gap-1">
        <span>{textos.admin.contrasena}</span>
        <input type="password" name="password" required autoComplete="current-password" className={campo} />
      </label>
      {estado.error && (
        <p role="alert" className="text-destacado">
          {estado.error}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="min-h-11 rounded-md bg-boton px-5 font-semibold text-boton-texto disabled:opacity-60"
      >
        {textos.admin.botonIngresar}
      </button>
      <Link href="/admin/olvide" className="inline-flex min-h-11 items-center text-titulo">
        {textos.admin.olvideContrasena}
      </Link>
    </form>
  );
}
