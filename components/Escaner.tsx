"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { codigoValido, mensajeErrorCamara, variantesCodigo } from "@/lib/escaneo";
import { crearLector, type Lector } from "@/lib/lector-codigos";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { textos } from "@/lib/textos";

const t = textos.escaner;
const CADA_MS = 200;

type Estado =
  | { tipo: "iniciando" }
  | { tipo: "escaneando" }
  | { tipo: "buscando" }
  | { tipo: "encontrado"; nombre: string }
  | { tipo: "no-encontrado"; codigo: string }
  | { tipo: "error"; mensaje: string };

/** Busca el código (y sus variantes) en la carta pública. */
async function buscarProducto(codigo: string) {
  const supabase = crearClienteNavegador();
  for (const variante of variantesCodigo(codigo)) {
    const { data } = await supabase.rpc("buscar_por_codigo_barras", { codigo: variante });
    if (data && data.length > 0) return { id: data[0].producto_id!, nombre: data[0].producto_nombre! };
  }
  return null;
}

export function Escaner() {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const flujo = useRef<MediaStream | null>(null);
  const [estado, setEstado] = useState<Estado>({ tipo: "iniciando" });
  const [intento, setIntento] = useState(0);

  const apagarCamara = useCallback(() => {
    flujo.current?.getTracks().forEach((pista) => pista.stop());
    flujo.current = null;
  }, []);

  useEffect(() => {
    let activo = true;
    let espera: ReturnType<typeof setTimeout> | undefined;
    let lector: Lector;

    async function leer() {
      if (!activo || !video.current) return;
      try {
        const lecturas = await lector.detect(video.current);
        const valida = lecturas.find((l) => codigoValido(l.rawValue, l.format));
        if (valida && activo) {
          navigator.vibrate?.(80);
          apagarCamara();
          setEstado({ tipo: "buscando" });
          const producto = await buscarProducto(valida.rawValue);
          if (!activo) return;
          if (producto) {
            setEstado({ tipo: "encontrado", nombre: producto.nombre });
            router.replace(`/producto/${producto.id}`);
          } else {
            setEstado({ tipo: "no-encontrado", codigo: valida.rawValue });
          }
          return;
        }
      } catch {
        // Un cuadro que no se pudo leer: se sigue con el próximo.
      }
      espera = setTimeout(leer, CADA_MS);
    }

    async function iniciar() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setEstado({ tipo: "error", mensaje: mensajeErrorCamara("SinSoporte") });
        return;
      }
      try {
        const [camara, nuevoLector] = await Promise.all([
          navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false }),
          crearLector(),
        ]);
        if (!activo) return camara.getTracks().forEach((p) => p.stop());
        flujo.current = camara;
        lector = nuevoLector;
        video.current!.srcObject = camara;
        await video.current!.play();
        setEstado({ tipo: "escaneando" });
        leer();
      } catch (error) {
        if (activo) setEstado({ tipo: "error", mensaje: mensajeErrorCamara((error as Error).name) });
      }
    }

    iniciar();
    window.addEventListener("pagehide", apagarCamara);
    return () => {
      activo = false;
      clearTimeout(espera);
      window.removeEventListener("pagehide", apagarCamara);
      apagarCamara();
    };
  }, [intento, apagarCamara, router]);

  const mostrarVideo = estado.tipo === "iniciando" || estado.tipo === "escaneando";
  const mensaje =
    estado.tipo === "iniciando" ? t.iniciando
    : estado.tipo === "escaneando" ? t.apuntando
    : estado.tipo === "buscando" ? t.buscando
    : estado.tipo === "encontrado" ? t.encontrado(estado.nombre)
    : estado.tipo === "no-encontrado" ? t.noEncontrado
    : estado.mensaje;

  return (
    <section className="mt-4">
      <div className={`relative overflow-hidden rounded-lg border border-dorado/40 bg-superficie ${mostrarVideo ? "" : "hidden"}`}>
        <video ref={video} aria-label={t.camara} muted playsInline className="block aspect-[3/4] w-full object-cover" />
        {/* Guía para encuadrar el código. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-[12%] top-[38%] h-[24%] rounded-md border-2 border-dorado" />
      </div>
      <p role="status" aria-live="polite" className="mt-3 text-lg">
        {mensaje}
      </p>
      {estado.tipo === "no-encontrado" && <p className="text-texto-suave">{t.codigoLeido(estado.codigo)}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {(estado.tipo === "no-encontrado" || estado.tipo === "error") && (
          <button
            type="button"
            onClick={() => {
              setEstado({ tipo: "iniciando" });
              setIntento((n) => n + 1);
            }}
            className="min-h-11 rounded-full bg-boton px-5 font-semibold text-boton-texto"
          >
            {t.escanearDeNuevo}
          </button>
        )}
        {estado.tipo === "no-encontrado" && (
          <Link href="/" className="inline-flex min-h-11 items-center rounded-full border border-dorado px-5">
            {t.buscarPorNombre}
          </Link>
        )}
        <button
          type="button"
          onClick={() => {
            apagarCamara();
            router.push("/");
          }}
          className="min-h-11 rounded-full border border-dorado px-5"
        >
          {t.cerrar}
        </button>
      </div>
    </section>
  );
}
