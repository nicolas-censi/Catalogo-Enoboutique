"use client";

// Cámara y lectura de códigos de barras de botellas, compartido por el escáner de la carta
// (spec 003) y el del panel (spec 019). Pide la cámara trasera, lee cada 100 ms y acepta
// solo códigos de botella válidos (dígito verificador). Al leer uno: vibra, apaga la cámara
// y avisa con `alLeer`. La cámara se apaga al desmontar y al salir de la página.
import { useCallback, useEffect, useRef, useState } from "react";
import { codigoValido, mensajeErrorCamara } from "@/lib/escaneo";
import { crearLector, type Lector } from "@/lib/lector-codigos";

// Se intenta leer un cuadro cada 100 ms: el código se reconoce apenas entra en foco.
const CADA_MS = 100;

// Capacidades que la cámara puede informar y TypeScript todavía no tipa.
type Capacidades = MediaTrackCapabilities & { focusMode?: string[] };
// Cámara trasera en alta resolución: los códigos chicos se leen mejor (spec 003, CA-9).
const VIDEO: MediaTrackConstraints = { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } };

export type EstadoCamara =
  | { tipo: "iniciando" }
  | { tipo: "escaneando" }
  | { tipo: "leido"; codigo: string }
  | { tipo: "error"; mensaje: string; codigo: string | null };

export function useLectorCamara(alLeer: (codigo: string) => void) {
  const video = useRef<HTMLVideoElement>(null);
  const flujo = useRef<MediaStream | null>(null);
  const [estado, setEstado] = useState<EstadoCamara>({ tipo: "iniciando" });
  const [intento, setIntento] = useState(0);
  // La última versión de alLeer, sin volver a encender la cámara cuando cambia.
  const avisar = useRef(alLeer);
  useEffect(() => {
    avisar.current = alLeer;
  }, [alLeer]);

  const apagar = useCallback(() => {
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
          apagar();
          setEstado({ tipo: "leido", codigo: valida.rawValue });
          avisar.current(valida.rawValue);
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
        if (!activo) return apagar();
        const pista = camara.getVideoTracks()[0];
        const capacidades = (pista.getCapabilities?.() ?? {}) as Capacidades;
        if (capacidades.focusMode?.includes("continuous")) {
          const enfoque = { focusMode: "continuous" } as MediaTrackConstraintSet;
          pista.applyConstraints({ advanced: [enfoque] }).catch(() => {});
        }
        video.current!.srcObject = camara;
        await video.current!.play();
        setEstado({ tipo: "escaneando" });
        leer();
      } catch (error) {
        apagar();
        const nombre = (error as Error)?.name || "Error";
        const mensaje = mensajeErrorCamara(nombre);
        // Si el problema no es uno de los conocidos, se muestra su código para diagnosticar.
        const conocido = mensaje !== mensajeErrorCamara("SinSoporte");
        if (activo) setEstado({ tipo: "error", mensaje, codigo: conocido ? null : nombre });
      }
    }

    iniciar();
    window.addEventListener("pagehide", apagar);
    return () => {
      activo = false;
      clearTimeout(espera);
      window.removeEventListener("pagehide", apagar);
      apagar();
    };
  }, [intento, apagar]);

  const reintentar = useCallback(() => {
    setEstado({ tipo: "iniciando" });
    setIntento((n) => n + 1);
  }, []);

  return { video, estado, reintentar, apagar };
}
