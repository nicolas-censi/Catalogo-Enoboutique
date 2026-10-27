import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const raiz = join(__dirname, "..", "..");
const css = readFileSync(join(raiz, "app", "globals.css"), "utf8");
const bloqueTheme = css.match(/@theme[^{]*\{([\s\S]*?)\n\}/)?.[1] ?? "";

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta];
  });
}

describe("tokens de marca", () => {
  it("el dorado de marca es el del logo", () => {
    expect(bloqueTheme.toLowerCase()).toContain("--color-dorado: #b19750;");
  });

  it.each([
    "fondo",
    "superficie",
    "texto",
    "destacado",
    "texto-suave",
    "titulo",
    "boton",
    "boton-texto",
  ])("define el color por función --color-%s", (token) => {
    expect(bloqueTheme).toMatch(new RegExp(`--color-${token}: #[0-9A-Fa-f]{6};`));
  });

  it("define las tipografías de títulos y de texto", () => {
    expect(bloqueTheme).toMatch(/--font-titulos:\s*var\(--font-inknut-antiqua\)/);
    expect(bloqueTheme).toMatch(/--font-texto:\s*var\(--font-cabin\)/);
  });

  it("no hay colores escritos a mano fuera de los tokens", () => {
    const fuentes = [...archivos(join(raiz, "app")), ...archivos(join(raiz, "components"))].filter(
      (ruta) => /\.(css|tsx?)$/.test(ruta),
    );
    for (const ruta of fuentes) {
      let contenido = readFileSync(ruta, "utf8");
      if (ruta.endsWith("globals.css")) contenido = contenido.replace(bloqueTheme, "");
      expect(contenido, ruta).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|\b(bg|text|border)-(white|black)\b/i);
    }
  });
});
