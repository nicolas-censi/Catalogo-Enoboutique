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

describe("ícono de la web", () => {
  it("favicon.ico no es el de Next.js y trae 16, 32 y 48 px", () => {
    const ico = readFileSync(join(app, "favicon.ico"));
    expect(createHash("sha256").update(ico).digest("hex")).not.toBe(NEXT_FAVICON_SHA);
    expect(tamanosIco(ico).sort((a, b) => a - b)).toEqual([16, 32, 48]);
  });

  it("icon.png: 512 px, cuadrado y transparente", async () => {
    const m = await sharp(join(app, "icon.png")).metadata();
    expect([m.width, m.height, m.hasAlpha]).toEqual([512, 512, true]);
  });

  it("apple-icon.png: 180 px, cuadrado y sin transparencia (fondo crema)", async () => {
    const archivo = join(app, "apple-icon.png");
    const m = await sharp(archivo).metadata();
    expect([m.width, m.height]).toEqual([180, 180]);
    const { data } = await sharp(archivo).ensureAlpha().extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
    expect([...data]).toEqual([0xf6, 0xf2, 0xe9, 255]);
  });
});
