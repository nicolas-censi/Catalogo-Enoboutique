import { describe, expect, it } from "vitest";
import { bodegaPorCodigo, nombreSugeridoBodega, seccionSugerida } from "@/lib/tango/clasificar";
import { DICCIONARIO_INICIAL } from "@/lib/tango/nombres";

// Spec 008, CA-5 y CA-6. Casos del reporte real.
describe("seccionSugerida (CA-6)", () => {
  it.each([
    ["destilado", "W J WALKER RED 750CC", "Destilados"],
    ["almacen", "SAL GOURMET SALVA MAL", "Almacén"],
    ["aceite", "AOVE ZUCCARDI PICUAL 500CC", "Almacén"],
    ["combo", "2024 BOX 1 - TRUMPETER", "Combos y boxes"],
    ["vino", "CHANDON ESP EX BRUT 375CC", "Espumantes"],
    ["vino", "TRAPICHE MEDALLA ESP BRUT NAT", "Espumantes"],
    ["vino", "CH VEUVE CLICQUOT LA G DAME", "Espumantes"],
    ["vino", "SIDRA DADA 750CC", "Espumantes"],
    ["vino", "SALENTEIN RVA ROSE", "Rosados"],
    ["vino", "SALENTEIN PRIMUS CHARDO", "Blancos"],
    ["vino", "RETO SAUV BLANC", "Blancos"],
    ["vino", "SALENTEIN RVA C BLANCAS", "Blancos"],
    ["vino", "BIANCHI STRADIVARIUS SEM DULCE", "Blancos"],
    ["vino", "SALENTEIN PRIMUS MAL", "Tintos"],
    ["vino", "TRAPICHE G MEDALLA CAB SAUV", "Tintos"],
    ["vino", "MIMI MAL-MER", "Tintos"],
    ["vino", "EMILIA RED BLEND", "Tintos"],
    ["vino", "SALENTEIN RVA C TINTAS", "Tintos"],
    ["vino", "TRUMPETER RVA TEMPRANILLO", "Tintos"],
    ["vino", "SALENTEIN NUMINA G CORTE", "Tintos"],
    ["vino", "RUTINI GEWURZT", "Blancos"],
    ["vino", "TRUMPETER RVA P GRIGIO", "Blancos"],
    // Dudosos: quedan sin sección para asignar a mano.
    ["vino", "FUEGO BCO MAL-SYRAH", null],
    ["vino", "CONFIADO ANFORA", null],
    ["vino", "EUGENIO BUSTOS", null],
    ["vino", "ZUELO WHITE BLEND", "Blancos"],
    ["vino", "HJ FABRE CHARDO - MAL", null],
  ] as const)("%s %s → %s", (tipo, descripcion, seccion) => {
    expect(seccionSugerida(tipo, descripcion)).toBe(seccion);
  });
});

describe("bodegas (CA-5)", () => {
  it("la bodega de un vino son las letras 3 a 5 del código; combos y otros tipos no tienen", () => {
    expect(bodegaPorCodigo("VIrut0080", "vino")).toBe("rut");
    expect(bodegaPorCodigo("VIZUC0001", "vino")).toBe("zuc");
    expect(bodegaPorCodigo("VIkit0001", "combo")).toBeNull();
    expect(bodegaPorCodigo("BAgle0001", "destilado")).toBeNull();
  });

  it("propone como nombre la palabra que más se repite en sus vinos, sin varietales ni estilos", () => {
    expect(nombreSugeridoBodega(["DV CATENA ESP NAT", "DV CATENA MAL", "SAINT FELICIEN MAL", "CATENA ZAPATA MAL", "ALAMOS MAL"], DICCIONARIO_INICIAL)).toBe("Catena");
    expect(nombreSugeridoBodega(["RUTINI MAL 2020", "TRUMPETER MAL", "RUTINI CAB SAUV"], DICCIONARIO_INICIAL)).toBe("Rutini");
    expect(nombreSugeridoBodega(["ESC GASCON MAL", "ESC GASCON PEQ PROD MAL"], DICCIONARIO_INICIAL)).toBe("Escorihuela");
    expect(nombreSugeridoBodega(["MAL 2020"], DICCIONARIO_INICIAL)).toBeNull();
  });
});
