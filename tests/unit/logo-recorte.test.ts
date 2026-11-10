import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { recortarLogo } from "@/lib/admin/logo";

// Spec 017, CA-3: el logo se guarda recortado al dibujo, con un margen mínimo.
const transparente = { r: 0, g: 0, b: 0, alpha: 0 };

async function logoConMargen(formato: "png" | "webp") {
  const dibujo = await sharp({ create: { width: 1900, height: 556, channels: 4, background: { r: 27, g: 26, b: 23, alpha: 1 } } }).png().toBuffer();
  return sharp({ create: { width: 1920, height: 1080, channels: 4, background: transparente } })
    .composite([{ input: dibujo, left: 10, top: 253 }])
    [formato]()
    .toBuffer();
}

describe("recortarLogo", () => {
  it("saca el margen transparente y deja 1 % alrededor (el caso del logo de 1920 × 1080)", async () => {
    const r = await recortarLogo(await logoConMargen("png"), "png");
    const m = await sharp(r).metadata();
    // 19 px (1 % del lado mayor del dibujo) de cada lado.
    expect(m.width).toBe(1900 + 38);
    expect(m.height).toBe(556 + 38);
    expect(m.format).toBe("png");
    expect(m.hasAlpha).toBe(true);
  });

  it("mantiene el formato WebP", async () => {
    const r = await recortarLogo(await logoConMargen("webp"), "webp");
    const m = await sharp(r).metadata();
    expect(m.format).toBe("webp");
    expect(m.height! / m.width!).toBeCloseTo(594 / 1938, 2);
  });

  it("saca también un margen blanco liso", async () => {
    const dibujo = await sharp({ create: { width: 400, height: 100, channels: 3, background: "#1B1A17" } }).png().toBuffer();
    const blanco = await sharp({ create: { width: 800, height: 600, channels: 3, background: "#FFFFFF" } })
      .composite([{ input: dibujo, left: 200, top: 250 }])
      .png()
      .toBuffer();
    const m = await sharp(await recortarLogo(blanco, "png")).metadata();
    expect(m.width).toBe(408);
    expect(m.height).toBe(108);
  });

  it("un logo sin margen queda casi igual (solo suma el 1 %)", async () => {
    const lleno = await sharp({ create: { width: 640, height: 190, channels: 4, background: { r: 27, g: 26, b: 23, alpha: 1 } } }).png().toBuffer();
    const m = await sharp(await recortarLogo(lleno, "png")).metadata();
    expect(m.width).toBe(640 + 12);
    expect(m.height).toBe(190 + 12);
  });
});
