import { describe, expect, it } from "vitest";
import { migracionesPendientes, versionDeArchivo } from "@/scripts/migraciones.mjs";

describe("migraciones", () => {
  it("toma la versión del prefijo numérico del archivo", () => {
    expect(versionDeArchivo("20261026120000_secciones.sql")).toEqual({
      version: "20261026120000",
      nombre: "secciones",
    });
  });

  it("rechaza archivos que no siguen el formato de la CLI de Supabase", () => {
    expect(() => versionDeArchivo("secciones.sql")).toThrow();
  });

  it("devuelve solo las pendientes, ordenadas por versión", () => {
    const archivos = [
      "20261026130000_anadas.sql",
      "20261026120000_secciones.sql",
      "20261026140000_codigos.sql",
    ];
    expect(migracionesPendientes(archivos, ["20261026120000"]).map((m) => m.version)).toEqual([
      "20261026130000",
      "20261026140000",
    ]);
  });
});
