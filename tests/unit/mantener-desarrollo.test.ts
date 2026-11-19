import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Spec 009, CA-5: el proyecto de desarrollo de Supabase no se pausa (7 días sin uso).
const ruta = join(__dirname, "..", "..", ".github", "workflows", "mantener-desarrollo.yml");
const texto = readFileSync(ruta, "utf8");
const crones = [...texto.matchAll(/^\s*- cron:\s*"([^"]+)"/gm)].map((m) => m[1]);

describe("tarea que mantiene activo el proyecto de desarrollo", () => {
  it("corre al menos dos veces por semana (nunca 7 días sin consultar) y también a mano", () => {
    const dias = crones.flatMap((cron) => {
      const dia = cron.trim().split(/\s+/)[4];
      return dia === "*" ? [0, 1, 2, 3, 4, 5, 6] : dia.split(",").map(Number);
    });
    const ordenados = [...new Set(dias)].sort((a, b) => a - b);
    expect(ordenados.length).toBeGreaterThanOrEqual(2);
    const huecos = ordenados.map((d, i) => ((ordenados[(i + 1) % ordenados.length] - d + 7) % 7) || 7);
    expect(Math.max(...huecos)).toBeLessThan(7);
    expect(texto).toMatch(/^\s*workflow_dispatch:/m);
  });

  it("toma la URL y la clave de los secrets, sin escribirlas en el archivo, y falla si la base no responde", () => {
    expect(texto).toContain("secrets.SUPABASE_URL_DESARROLLO");
    expect(texto).toContain("secrets.SUPABASE_PUBLISHABLE_KEY_DESARROLLO");
    expect(texto).not.toMatch(/supabase\.co|sb_publishable_|eyJ/);
    expect(texto).toMatch(/curl[^\n]*--fail/);
    expect(texto).toContain("/rest/v1/marca");
  });
});
