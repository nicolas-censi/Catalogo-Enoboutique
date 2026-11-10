import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Spec 014 (CA-2) y spec 016 (CA-1): un solo tema claro para la carta y el panel, con
// contraste WCAG AA.
const css = readFileSync(join(__dirname, "..", "..", "app", "globals.css"), "utf8");
const bloque = css.match(/@theme\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
const color = (token: string) => {
  const valor = bloque.match(new RegExp(`--color-${token}:\\s*(#[0-9A-Fa-f]{6});`))?.[1];
  if (!valor) throw new Error(`Falta --color-${token} en @theme`);
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

describe("tema de la carta y del panel", () => {
  it("son los colores del panel: crema, casi negro y gris cálido (spec 016, CA-1)", () => {
    expect(color("fondo")).toBe("#F6F2E9");
    expect(color("superficie")).toBe("#FFFFFF");
    for (const t of ["texto", "destacado", "titulo"]) expect(color(t)).toBe("#1B1A17");
    expect(color("texto-suave")).toBe("#5E584C");
    expect(color("carta-fondo")).toBe("#F6F2E9");
    expect(color("carta-texto")).toBe("#1B1A17");
  });

  it("el panel ya no tiene colores propios", () => {
    const panel = css.match(/\.tema-panel\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
    expect(panel).not.toMatch(/^\s*--color-/m);
  });

  it.each([
    ["texto", "fondo"],
    ["texto", "superficie"],
    ["texto-suave", "fondo"],
    ["texto-suave", "superficie"],
    ["titulo", "fondo"],
    ["destacado", "fondo"],
    ["destacado", "superficie"],
    ["carta-texto", "carta-fondo"],
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
