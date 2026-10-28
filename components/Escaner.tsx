"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { codigoValido, mensajeErrorCamara, variantesCodigo } from "@/lib/escaneo";
import { crearLector, type Lector } from "@/lib/lector-codigos";
import { camaraConLinterna, navegadorSoportaLinterna, tieneLinterna } from "@/lib/linterna";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { textos } from "@/lib/textos";

const t = textos.escaner;
const CADA_MS = 200;

// Capacidades que la cámara puede informar y TypeScript todavía no tipa.
type Capacidades = MediaTrackCapabilities & { focusMode?: string[] };
// Cámara trasera en alta resolución: los códigos chicos se leen mejor (CA-10).
const VIDEO: MediaTrackConstraints = { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } };
type Avanzadas = MediaTrackConstraintSet & { torch?: boolean; focusMode?: string };
const avanzadas = (r: Avanzadas): MediaTrackConstraints => ({ advanced: [r as MediaTrackConstraintSet] });

type Estado =
  | { tipo: "iniciando" }
  | { tipo: "escaneando" }
  | { tipo: "buscando" }
  | { tipo: "encontrado"; nombre: string }
  | { tipo: "no-encontrado"; codigo: string }
  | { tipo: "error"; mensaje: string; codigo: string | null };

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
  const [linterna, setLinterna] = useState<{ disponible: boolean; prendida: boolean }>({ disponible: false, prendida: false });
  const [avisoLinterna, setAvisoLinterna] = useState<string | null>(null);

  const apagarCamara = useCallback(() => {
    // Al apagar la cámara se apaga también la linterna.
    flujo.current?.getTracks().forEach((pista) => pista.stop());
    flujo.current = null;
    setLinterna({ disponible: false, prendida: false });
  }, []);

  async function alternarLinterna() {
    let pista = flujo.current?.getVideoTracks()[0];
    if (!pista) return;
    const prender = !linterna.prendida;
    if (prender && !tieneLinterna(pista)) {
      // La cámara abierta no tiene flash: se busca otra trasera que sí lo tenga.
      const otra = await camaraConLinterna(pista.getSettings().deviceId, VIDEO);
      if (!otra) {
        setLinterna({ disponible: false, prendida: false });
        setAvisoLinterna(t.sinLinterna);
        return;
      }
      flujo.current?.getTracks().forEach((p) => p.stop());
      flujo.current = otra;
      video.current!.srcObject = otra;
      await video.current!.play().catch(() => {});
      pista = otra.getVideoTracks()[0];
    }
    try {
      await pista.applyConstraints(avanzadas({ torch: prender }));
      setLinterna({ disponible: true, prendida: prender });
    } catch {
      setLinterna({ disponible: false, prendida: false });
      setAvisoLinterna(t.sinLinterna);
    }
  }

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
        setEstado({ tipo: "error", mensaje: mensajeErrorCamara("SinSoporte"), codigo: null });
        return;
      }
      try {
        // Primero el lector y después la cámara: si el lector no carga, la cámara ni se
        // enciende; y si algo falla después, se apaga (ver catch).
        lector = await crearLector();
        const camara = await navigator.mediaDevices.getUserMedia({ video: VIDEO, audio: false });
        flujo.current = camara;
        if (!activo) return apagarCamara();
        const pista = camara.getVideoTracks()[0];
        const capacidades = (pista.getCapabilities?.() ?? {}) as Capacidades;
        if (capacidades.focusMode?.includes("continuous")) {
          pista.applyConstraints(avanzadas({ focusMode: "continuous" })).catch(() => {});
        }
        // Se muestra el botón si la cámara ya informa linterna o si el navegador la soporta
        // (Chrome la informa tarde, o abre una cámara sin flash: se resuelve al tocar).
        setLinterna({ disponible: tieneLinterna(pista) || navegadorSoportaLinterna(), prendida: false });
        video.current!.srcObject = camara;
        await video.current!.play();
        setEstado({ tipo: "escaneando" });
        leer();
      } catch (error) {
        apagarCamara();
        const nombre = (error as Error)?.name || "Error";
        const mensaje = mensajeErrorCamara(nombre);
        // Si el problema no es uno de los conocidos, se muestra su código para diagnosticar.
        const conocido = mensaje !== mensajeErrorCamara("SinSoporte");
        if (activo) setEstado({ tipo: "error", mensaje, codigo: conocido ? null : nombre });
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
      {avisoLinterna && estado.tipo === "escaneando" && <p className="text-sm text-texto-suave">{avisoLinterna}</p>}
      {estado.tipo === "error" && estado.codigo && (
        <p className="text-sm text-texto-suave">{t.codigoProblema(estado.codigo)}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {estado.tipo === "escaneando" && linterna.disponible && (
          <button
            type="button"
            aria-pressed={linterna.prendida}
            onClick={alternarLinterna}
            className={`min-h-11 rounded-full border border-dorado px-5 font-semibold ${linterna.prendida ? "bg-dorado text-boton-texto" : ""}`}
          >
            {linterna.prendida ? t.apagarLinterna : t.prenderLinterna}
          </button>
        )}
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
