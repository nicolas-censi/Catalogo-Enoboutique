import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { respaldar, TABLAS } from "../../scripts/tablas.mjs";

// Spec 009, CA-7: el respaldo descarga todas las tablas.
describe("respaldo", () => {
  it("incluye todas las tablas de la base (las de lib/tipos-db.ts)", () => {
    const tipos = readFileSync("lib/tipos-db.ts", "utf8");
    const publico = tipos.slice(tipos.indexOf("public: {"), tipos.indexOf("Views:", tipos.indexOf("public: {")));
    const tablas = [...publico.matchAll(/\n {6}(\w+): \{\n {8}Row/g)].map((m) => m[1]);
    expect([...TABLAS].sort()).toEqual(tablas.sort());
  });

  it("guarda un archivo por tabla con sus filas y devuelve las cantidades", async () => {
    const guardadas: Record<string, unknown[]> = {};
    const cantidades = await respaldar(
      async (q: string) => [{ filas: q.includes("public.productos ") ? [{ id: 1 }, { id: 2 }] : [] }],
      (tabla: string, filas: unknown[]) => (guardadas[tabla] = filas),
    );
    expect(Object.keys(guardadas)).toEqual(TABLAS);
    expect(cantidades.productos).toBe(2);
    expect(cantidades.secciones).toBe(0);
  });
});
