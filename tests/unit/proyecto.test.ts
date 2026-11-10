import { describe, expect, it } from "vitest";
import { elegirProyecto } from "../../scripts/proyecto.mjs";

// Spec 009, T1 (CA-1): los scripts db:* van a desarrollo salvo que se pida producción.
const env = { SUPABASE_PROJECT_REF: "dev123", SUPABASE_PROJECT_REF_PRODUCCION: "prod456" };

describe("elegirProyecto", () => {
  it("por defecto, desarrollo", () => {
    expect(elegirProyecto({ argv: ["node", "migrar.mjs"], env })).toEqual({ ref: "dev123", produccion: false });
  });
  it("con --produccion, producción", () => {
    expect(elegirProyecto({ argv: ["node", "migrar.mjs", "--produccion"], env })).toEqual({ ref: "prod456", produccion: true });
  });
  it("sin la variable de producción, o si es igual a la de desarrollo, no sigue", () => {
    expect(() => elegirProyecto({ argv: ["--produccion"], env: { SUPABASE_PROJECT_REF: "dev123" } })).toThrow(/SUPABASE_PROJECT_REF_PRODUCCION/);
    expect(() => elegirProyecto({ argv: ["--produccion"], env: { SUPABASE_PROJECT_REF: "x", SUPABASE_PROJECT_REF_PRODUCCION: "x" } })).toThrow(/igual/);
    expect(() => elegirProyecto({ argv: [], env: {} })).toThrow(/SUPABASE_PROJECT_REF/);
  });
});
