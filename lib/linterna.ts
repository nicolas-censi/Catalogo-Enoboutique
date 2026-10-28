// Linterna (flash) de la cámara en el navegador. En Chrome para Android se prende con
// applyConstraints({ advanced: [{ torch: true }] }), pero:
// - la cámara puede informar la linterna recién cuando el video ya está corriendo;
// - muchos Android tienen varias cámaras traseras y Chrome puede abrir una sin flash.
// Safari (iPhone) no permite la linterna: ahí el botón no se muestra.

type Capacidades = MediaTrackCapabilities & { torch?: boolean };
type Soportadas = MediaTrackSupportedConstraints & { torch?: boolean };

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function tieneLinterna(pista: MediaStreamTrack | undefined): boolean {
  return (pista?.getCapabilities?.() as Capacidades | undefined)?.torch === true;
}

/** true si el navegador sabe manejar la linterna (Chrome sí, Safari no). */
export function navegadorSoportaLinterna(): boolean {
  return (navigator.mediaDevices?.getSupportedConstraints?.() as Soportadas | undefined)?.torch === true;
}

/** Vuelve a consultar unos instantes después: la linterna puede informarse tarde. */
export async function esperarLinterna(pista: MediaStreamTrack, esperas = [300, 700]): Promise<boolean> {
  if (tieneLinterna(pista)) return true;
  for (const ms of esperas) {
    await esperar(ms);
    if (tieneLinterna(pista)) return true;
  }
  return false;
}

/** Prueba las otras cámaras traseras hasta encontrar una con linterna. */
export async function camaraConLinterna(
  idActual: string | undefined,
  video: MediaTrackConstraints,
): Promise<MediaStream | null> {
  const dispositivos = await navigator.mediaDevices.enumerateDevices();
  const camaras = dispositivos.filter((d) => d.kind === "videoinput" && d.deviceId && d.deviceId !== idActual);
  // Primero las que parecen traseras (las etiquetas dependen del celular).
  camaras.sort((a, b) => Number(/back|rear|trasera|environment/i.test(b.label)) - Number(/back|rear|trasera|environment/i.test(a.label)));
  for (const camara of camaras) {
    try {
      const flujo = await navigator.mediaDevices.getUserMedia({
        video: { ...video, facingMode: undefined, deviceId: { exact: camara.deviceId } },
        audio: false,
      });
      if (await esperarLinterna(flujo.getVideoTracks()[0])) return flujo;
      flujo.getTracks().forEach((p) => p.stop());
    } catch {
      // Esa cámara no se pudo abrir: se prueba la siguiente.
    }
  }
  return null;
}
