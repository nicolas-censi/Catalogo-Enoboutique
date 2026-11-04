import { describe, expect, it } from "vitest";
import { enTandas, esDePrueba, literal, planCopia, TABLAS_A_COPIAR } from "../../scripts/copia-plan.mjs";

// Spec 009, CA-2: qué se copia a producción y en qué orden.
const prueba = "test-mw2fuikg-754abc";

describe("planCopia", () => {
  const datos = {
    secciones: [
      { id: "sub", nombre: "Joyitas", seccion_padre_id: "cava" },
      { id: "cava", nombre: "Cava", seccion_padre_id: null },
      { id: "s-test", nombre: `${prueba} Tintos`, seccion_padre_id: null },
    ],
    bodegas: [{ id: "b1", nombre: "Rutini" }, { id: "b-test", nombre: `Bodega ${prueba}` }],
    productos: [
      { id: "p1", nombre: "Rutini Malbec", seccion_id: "sub", bodega_id: "b1" },
      { id: "p2", nombre: "Otro", seccion_id: "s-test", bodega_id: "b-test" },
      { id: "p-test", nombre: `Malbec ${prueba}`, seccion_id: "cava", bodega_id: "b1" },
    ],
    anadas: [{ id: "a1", producto_id: "p1" }, { id: "a2", producto_id: "p-test" }],
    codigos_barras: [{ codigo: "779", producto_id: "p1" }, { codigo: "778", producto_id: "p-test" }],
    personal: [{ user_id: "u1", rol: "encargado" }, { user_id: "u-test", rol: "vendedor" }],
    sugerencias: [
      { id: "g1", producto_id: "p1", estado: "lista", pedida_por: "u1", revisada_por: null },
      { id: "g2", producto_id: "p1", estado: "aprobada", pedida_por: "u1" },
      { id: "g3", producto_id: "p2", estado: "en_cola", pedida_por: "u-test" },
    ],
    importaciones: [{ id: "i1", creada_por: "u-test" }],
  };
  const plan = planCopia(datos, new Set(["u1"]));

  it("no copia nada de los tests ni lo que depende de eso", () => {
    expect(plan.secciones.map((s) => s.id)).toEqual(["cava", "sub"]);
    expect(plan.bodegas.map((b) => b.id)).toEqual(["b1"]);
    expect(plan.productos.map((p) => p.id)).toEqual(["p1", "p2"]);
    expect(plan.anadas.map((a) => a.id)).toEqual(["a1"]);
    expect(plan.codigos_barras.map((c) => c.codigo)).toEqual(["779"]);
    expect(plan.personal.map((p) => p.user_id)).toEqual(["u1"]);
  });

  it("las secciones padre van antes que sus subsecciones", () => {
    expect(plan.secciones[0].id).toBe("cava");
  });

  it("un producto que estaba en algo de los tests queda sin sección ni bodega", () => {
    expect(plan.productos.find((p) => p.id === "p2")).toMatchObject({ seccion_id: null, bodega_id: null });
  });

  it("de las sugerencias, solo las pendientes; los usuarios que no se copian quedan vacíos", () => {
    expect(plan.sugerencias.map((s) => s.id)).toEqual(["g1", "g3"]);
    expect(plan.sugerencias.find((s) => s.id === "g3")!.pedida_por).toBeNull();
    expect(plan.importaciones[0].creada_por).toBeNull();
  });

  it("no copia ajustes_ia (producción empieza con la IA apagada)", () => {
    expect(TABLAS_A_COPIAR).not.toContain("ajustes_ia");
    expect(TABLAS_A_COPIAR[0]).toBe("secciones");
  });
});

describe("ayudas", () => {
  it("reconoce el prefijo de los tests, parte en tandas y escapa comillas", () => {
    expect(esDePrueba({ nombre: `x ${prueba}` })).toBe(true);
    expect(esDePrueba({ nombre: "Vino test" })).toBe(false);
    expect(enTandas([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(literal("D'Alessandro")).toBe("'D''Alessandro'");
  });
});
