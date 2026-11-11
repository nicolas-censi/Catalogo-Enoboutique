import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

// Spec 018, CA-1: el ícono de la web es el isotipo de Lehonor, no el de Next.js.
const app = join(__dirname, "..", "..", "app");
const NEXT_FAVICON_SHA = "c28fdd2a4f31e2dc64f653962286da5c82a4cdfc518b242d32812c624e9a19a4";

/** Tamaños de las imágenes que trae un .ico (cabecera ICONDIR + entradas de 16 bytes). */
function tamanosIco(ico: Buffer) {
  expect(ico.readUInt16LE(2)).toBe(1); // tipo: ícono
  return Array.from({ length: ico.readUInt16LE(4) }, (_, i) => ico[6 + i * 16] || 256);
}

/** RGBA de un píxel; si es transparente, solo el alfa. */
async function pixel(archivo: string, x: number, y: number) {
  const { data } = await sharp(archivo).ensureAlpha().extract({ left: x, top: y, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
  return data[3] === 0 ? [0] : [...data];
}

describe("ícono de la web", () => {
  it("favicon.ico no es el de Next.js y trae 16, 32 y 48 px", () => {
    const ico = readFileSync(join(app, "favicon.ico"));
    expect(createHash("sha256").update(ico).digest("hex")).not.toBe(NEXT_FAVICON_SHA);
    expect(tamanosIco(ico).sort((a, b) => a - b)).toEqual([16, 32, 48]);
  });

  it("icon.png: 512 px, el isotipo sobre un círculo casi negro con las esquinas transparentes", async () => {
    const archivo = join(app, "icon.png");
    const m = await sharp(archivo).metadata();
    expect([m.width, m.height, m.hasAlpha]).toEqual([512, 512, true]);
    expect(await pixel(archivo, 2, 2)).toEqual([0]);
    // Borde del círculo (fuera del dibujo): casi negro.
    expect(await pixel(archivo, 256, 12)).toEqual([0x1b, 0x1a, 0x17, 255]);
  });

  it("apple-icon.png: 180 px, sin transparencia: el círculo sobre crema", async () => {
    const archivo = join(app, "apple-icon.png");
    const m = await sharp(archivo).metadata();
    expect([m.width, m.height]).toEqual([180, 180]);
    expect(await pixel(archivo, 0, 0)).toEqual([0xf6, 0xf2, 0xe9, 255]);
    expect(await pixel(archivo, 90, 20)).toEqual([0x1b, 0x1a, 0x17, 255]);
  });
});
