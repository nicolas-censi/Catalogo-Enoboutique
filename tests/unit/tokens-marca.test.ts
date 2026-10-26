import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const raiz = join(__dirname, "..", "..");
const css = readFileSync(join(raiz, "app", "globals.css"), "utf8");
const bloqueTheme = css.match(/@theme[^{]*\{([\s\S]*?)\}/)?.[1] ?? "";

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta];
  });
}

describe("tokens de marca", () => {
  it.each([
    ["--color-negro", "#000000"],
    ["--color-fondo", "#f7f8fb"],
    ["--color-dorado", "#b19750"],
  ])("define %s = %s", (token, valor) => {
    expect(bloqueTheme.toLowerCase()).toContain(`${token}: ${valor};`);
  });

  it("define las tipografías de títulos y de texto", () => {
    expect(bloqueTheme).toMatch(/--font-titulos:\s*var\(--font-inknut-antiqua\)/);
    expect(bloqueTheme).toMatch(/--font-texto:\s*var\(--font-cabin\)/);
  });

  it("no hay colores escritos a mano fuera de los tokens", () => {
    const fuentes = archivos(join(raiz, "app")).filter((ruta) =>
      /\.(css|tsx?)$/.test(ruta),
    );
    for (const ruta of fuentes) {
      let contenido = readFileSync(ruta, "utf8");
      if (ruta.endsWith("globals.css")) contenido = contenido.replace(bloqueTheme, "");
      expect(contenido, ruta).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i);
    }
  });
});
