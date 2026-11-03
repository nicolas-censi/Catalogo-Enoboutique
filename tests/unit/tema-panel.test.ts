import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Spec 014, CA-2: el tema del panel (colores de la carta invertidos) cumple WCAG AA.
const css = readFileSync(join(__dirname, "..", "..", "app", "globals.css"), "utf8");
const bloque = css.match(/\.tema-panel\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
const color = (token: string) => {
  const valor = bloque.match(new RegExp(`--color-${token}:\\s*(#[0-9A-Fa-f]{6});`))?.[1];
  if (!valor) throw new Error(`Falta --color-${token} en .tema-panel`);
  return valor;
};

function luminancia(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contraste(a: string, b: string) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

describe("tema del panel", () => {
  it("es claro: fondo crema y texto casi negro (la carta invertida)", () => {
    expect(luminancia(color("fondo"))).toBeGreaterThan(0.8);
    expect(luminancia(color("texto"))).toBeLessThan(0.05);
  });

  it.each([
    ["texto", "fondo"],
    ["texto", "superficie"],
    ["texto-suave", "fondo"],
    ["texto-suave", "superficie"],
    ["titulo", "fondo"],
    ["destacado", "superficie"],
    ["boton-texto", "boton"],
    ["error", "fondo"],
    ["error", "superficie"],
    ["dorado-texto", "fondo"],
    ["dorado-texto", "superficie"],
  ])("texto %s sobre %s: al menos 4,5:1", (a, b) => {
    expect(contraste(color(a), color(b))).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ["control", "fondo"],
    ["control", "superficie"],
    ["boton", "fondo"],
  ])("bordes y botones (%s sobre %s): al menos 3:1", (a, b) => {
    expect(contraste(color(a), color(b))).toBeGreaterThanOrEqual(3);
  });
});
