"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { guardarBienvenida, guardarLogo, volverLogoOriginal } from "@/app/admin/acciones-marca";
import { LARGO_BIENVENIDA, rutaLogo, validarArchivoLogo } from "@/lib/admin/marca";
import { urlLogo } from "@/lib/fotos";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { textos } from "@/lib/textos";
import logoOriginal from "@/public/logo-enoboutique.png";

const t = textos.admin.marca;
const control =
  "rounded-md border border-dorado/60 bg-superficie px-3 py-2 text-base text-texto focus:outline-2 focus:outline-dorado";
const principal = "inline-flex min-h-11 items-center rounded-md bg-boton px-5 font-semibold text-boton-texto disabled:opacity-60";
const secundario = "inline-flex min-h-11 cursor-pointer items-center rounded-md border border-dorado/60 px-4 disabled:opacity-60";
type Mensaje = { error: string | null; aviso: string | null };

function Bienvenida({ inicial }: { inicial: string }) {
  const [texto, setTexto] = useState(inicial);
  const [mensaje, setMensaje] = useState<Mensaje>({ error: null, aviso: null });
  const [guardando, iniciar] = useTransition();
  return (
    <form
      className="flex max-w-xl flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        iniciar(async () => {
          const r = await guardarBienvenida(texto);
          setMensaje({ error: r.error, aviso: r.error ? null : t.bienvenidaGuardada });
        });
      }}
    >
      <label htmlFor="bienvenida" className="font-semibold">{t.bienvenida}</label>
      <p id="bienvenida-ayuda" className="text-sm text-texto-suave">{t.bienvenidaAyuda}</p>
      <textarea
        id="bienvenida"
        value={texto}
        maxLength={LARGO_BIENVENIDA}
        rows={3}
        aria-describedby="bienvenida-ayuda bienvenida-cuenta"
        onChange={(e) => setTexto(e.target.value)}
        className={control}
      />
      <p id="bienvenida-cuenta" className="text-sm text-texto-suave">{t.caracteres(texto.length, LARGO_BIENVENIDA)}</p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={guardando} className={principal}>{t.guardarBienvenida}</button>
        {mensaje.aviso && <span role="status">{mensaje.aviso}</span>}
        {mensaje.error && <span role="alert" className="text-destacado">{mensaje.error}</span>}
      </div>
    </form>
  );
}

function Logo({ logoPath }: { logoPath: string | null }) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [vista, setVista] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<Mensaje>({ error: null, aviso: null });
  const [ocupado, iniciar] = useTransition();

  // La vista previa usa una dirección temporal del navegador: se libera al cambiarla.
  useEffect(() => () => void (vista && URL.revokeObjectURL(vista)), [vista]);

  return (
    <div className="flex max-w-xl flex-col gap-3">
      <h2 className="font-semibold">{t.logo}</h2>
      <p className="text-sm text-texto-suave">{t.logoAyuda}</p>
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm text-texto-suave">{t.logoActual}</span>
        <div className="rounded-md bg-fondo p-3">
          {logoPath ? (
            <Image src={urlLogo(logoPath)} alt={t.logoActual} width={480} height={270} className="h-14 w-auto" />
          ) : (
            <Image src={logoOriginal} alt={t.logoActual} className="h-14 w-auto" />
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="logo-nuevo" className="text-sm text-texto-suave">{t.elegirLogo}</label>
        <input
          id="logo-nuevo"
          type="file"
          accept="image/png,image/webp,.png,.webp"
          onChange={(e) => {
            const elegido = e.target.files?.[0] ?? null;
            e.target.value = "";
            setMensaje({ error: null, aviso: null });
            if (!elegido) return;
            const error = validarArchivoLogo(elegido);
            if (error) {
              setArchivo(null);
              setVista(null);
              return setMensaje({ error, aviso: null });
            }
            setArchivo(elegido);
            setVista(URL.createObjectURL(elegido));
          }}
          className="min-h-11 w-full min-w-0 text-base file:mr-3 file:min-h-11 file:rounded-md file:border file:border-dorado/60 file:bg-superficie file:px-4 file:text-texto"
        />
      </div>
      {vista && (
        // Sobre el fondo de la carta, como se va a ver.
        <div className="rounded-md border border-dorado/40 bg-fondo p-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:), sin optimizar */}
          <img src={vista} alt={t.vistaPrevia} className="mx-auto h-14 w-auto" />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {archivo && (
          <button
            type="button"
            disabled={ocupado}
            className={principal}
            onClick={() =>
              iniciar(async () => {
                const extension = archivo.type === "image/webp" ? "webp" : "png";
                const ruta = rutaLogo(extension);
                const subida = await crearClienteNavegador().storage.from("marca").upload(ruta, archivo, { contentType: archivo.type });
                if (subida.error) return setMensaje({ error: textos.admin.errorGuardar, aviso: null });
                const r = await guardarLogo(ruta);
                setMensaje({ error: r.error, aviso: r.error ? null : t.logoGuardado });
                if (!r.error) {
                  setArchivo(null);
                  setVista(null);
                }
              })
            }
          >
            {t.guardarLogo}
          </button>
        )}
        {logoPath && (
          <button
            type="button"
            disabled={ocupado}
            className={secundario}
            onClick={() =>
              iniciar(async () => {
                const r = await volverLogoOriginal();
                setMensaje({ error: r.error, aviso: r.error ? null : t.logoOriginalRestaurado });
              })
            }
          >
            {t.volverOriginal}
          </button>
        )}
        {mensaje.aviso && <span role="status">{mensaje.aviso}</span>}
        {mensaje.error && <span role="alert" className="text-destacado">{mensaje.error}</span>}
      </div>
    </div>
  );
}

export function EditorMarca({ bienvenida, logoPath }: { bienvenida: string | null; logoPath: string | null }) {
  return (
    <div className="flex flex-col gap-10">
      <Bienvenida inicial={bienvenida ?? ""} />
      <Logo logoPath={logoPath} />
    </div>
  );
}
