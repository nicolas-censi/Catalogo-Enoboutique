"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { guardarFoto, quitarFoto } from "@/app/admin/acciones-fotos";
import { reducirFoto, rutaFoto, validarArchivoFoto } from "@/lib/admin/fotos";
import { urlFoto } from "@/lib/fotos";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { textos } from "@/lib/textos";

const t = textos.admin;
const boton = "inline-flex min-h-11 cursor-pointer items-center rounded-md border border-dorado/60 px-4";

export function SubirFoto({ productoId, nombre, fotoPath }: { productoId: string; nombre: string; fotoPath: string | null }) {
  const [error, setError] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();

  function alElegir(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!archivo) return;
    const invalido = validarArchivoFoto(archivo);
    setError(invalido);
    if (invalido) return;
    iniciar(async () => {
      const { datos, tipo, extension } = await reducirFoto(archivo);
      const ruta = rutaFoto(productoId, extension);
      const subida = await crearClienteNavegador().storage.from("fotos").upload(ruta, datos, { contentType: tipo });
      if (subida.error) return setError(t.errorGuardar);
      setError((await guardarFoto(productoId, ruta)).error);
    });
  }

  return (
    <div className="flex flex-wrap items-start gap-6">
      {fotoPath ? (
        <Image
          src={urlFoto(fotoPath)}
          alt={t.fotoDe(nombre)}
          width={160}
          height={213}
          className="h-52 w-auto rounded-md border border-dorado/40 object-contain"
        />
      ) : (
        <p className="text-texto-suave">{t.sinFotoFicha}</p>
      )}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <label className={`${boton} bg-boton font-semibold text-boton-texto`}>
            {ocupado ? t.subiendoFoto : fotoPath ? t.reemplazarFoto : t.subirFoto}
            <input
              type="file"
              accept="image/*,.heic,.heif"
              aria-label={t.subirFoto}
              disabled={ocupado}
              onChange={alElegir}
              className="sr-only"
            />
          </label>
          {fotoPath && (
            <button
              type="button"
              disabled={ocupado}
              onClick={() => iniciar(async () => setError((await quitarFoto(productoId)).error))}
              className={boton}
            >
              {t.quitarFoto}
            </button>
          )}
        </div>
        <p className="text-sm text-texto-suave">{t.fotoAyuda}</p>
        {error && (
          <p role="alert" className="text-destacado">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
