// Genera videos .y4m con un código de barras EAN-13, para usarlos como cámara simulada
// de Chromium (--use-file-for-fake-video-capture). Se generan al vuelo en la carpeta
// temporal del sistema (no se versionan).
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
const G = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"];
const R = ["1110010", "1100110", "1101100", "1000010", "1011100", "1001110", "1010000", "1000100", "1001000", "1110100"];
const PARIDAD = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];

/** Módulos (1 = barra negra) de un EAN-13. */
export function modulosEan13(codigo: string): string {
  const d = [...codigo].map(Number);
  const izquierda = d
    .slice(1, 7)
    .map((n, i) => (PARIDAD[d[0]][i] === "L" ? L[n] : G[n]))
    .join("");
  const derecha = d.slice(7).map((n) => R[n]).join("");
  return `101${izquierda}01010${derecha}101`;
}

export function videoConCodigo(codigo: string, ancho = 640, alto = 480): string {
  // Fuera de test-results: Playwright vacía esa carpeta al empezar cada corrida.
  const carpeta = join(tmpdir(), "catalogo-enoboutique-videos");
  const ruta = join(carpeta, `ean-${codigo}.y4m`);
  if (existsSync(ruta)) return ruta;
  mkdirSync(carpeta, { recursive: true });

  const modulos = modulosEan13(codigo);
  const escala = 4; // px por módulo: 95 módulos → 380 px
  const margenX = Math.floor((ancho - modulos.length * escala) / 2);
  const y = Buffer.alloc(ancho * alto, 235); // fondo blanco (luma)
  for (let fila = Math.floor(alto * 0.25); fila < Math.floor(alto * 0.75); fila++) {
    for (let i = 0; i < modulos.length; i++) {
      if (modulos[i] !== "1") continue;
      y.fill(16, fila * ancho + margenX + i * escala, fila * ancho + margenX + (i + 1) * escala);
    }
  }
  const croma = Buffer.alloc((ancho / 2) * (alto / 2) * 2, 128); // U y V neutros
  const cuadro = Buffer.concat([Buffer.from("FRAME\n"), y, croma]);
  const encabezado = Buffer.from(`YUV4MPEG2 W${ancho} H${alto} F10:1 Ip A1:1 C420jpeg\n`);
  writeFileSync(ruta, Buffer.concat([encabezado, cuadro, cuadro]));
  return ruta;
}

/** Opciones de Chromium para usar un video como cámara, con el permiso ya concedido. */
export function camaraSimulada(codigo: string) {
  return {
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
      args: [
        "--use-fake-device-for-media-stream",
        "--use-fake-ui-for-media-stream",
        `--use-file-for-fake-video-capture=${videoConCodigo(codigo)}`,
      ],
    },
    permissions: ["camera"],
  };
}
