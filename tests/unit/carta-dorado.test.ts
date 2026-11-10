import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Spec 016, CA-2: en la carta el dorado del logo va solo en adornos (líneas). Sobre crema
// tiene 2,5:1: no alcanza para texto, íconos, focos ni bordes de botones o campos.
const raiz = join(__dirname, "..", "..");

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (nombre === "admin") return [];
    return statSync(ruta).isDirectory() ? archivos(ruta) : ruta.endsWith(".tsx") ? [ruta] : [];
  });
}

const carta = [...archivos(join(raiz, "app")), ...archivos(join(raiz, "components"))];

describe("el dorado en la carta", () => {
  it("no se usa para texto, íconos ni focos", () => {
    for (const ruta of carta) {
      expect(readFileSync(ruta, "utf8"), ruta).not.toMatch(/\b(?:[a-z-]+:)*(text|outline|ring|fill|stroke|placeholder)-dorado\b/);
    }
  });

  it("no es el borde de botones ni campos (rounded-full con borde)", () => {
    for (const ruta of carta) {
      expect(readFileSync(ruta, "utf8"), ruta).not.toMatch(/rounded-full[^"]*\bborder-dorado|\bborder-dorado[^"]*rounded-full/);
    }
  });

  it("al enfocar el buscador, la línea se oscurece (no queda en dorado)", () => {
    const buscador = readFileSync(join(raiz, "components", "FormularioBusqueda.tsx"), "utf8");
    expect(buscador).not.toMatch(/focus-within:border-dorado/);
  });
});
