import { describe, expect, it } from "vitest";
import { agrupar, separarAnada } from "@/lib/tango/anadas";
import type { ArticuloTango } from "@/lib/tango/reporte";

// Spec 008, CA-3. Casos tomados del reporte real de Tango.
describe("separarAnada", () => {
  it.each([
    ["RUTINI MAL 2023", "RUTINI MAL", 2023],
    ["RUTINI MAL", "RUTINI MAL", null],
    ["SALENTEIN PRIMUS MAL 2019", "SALENTEIN PRIMUS MAL", 2019],
    // Año antes del tamaño: el tamaño queda en la clave (otro producto).
    ["ZUCCARDI TITO BLEND 2014 MAGNUM", "ZUCCARDI TITO BLEND MAGNUM", 2014],
    ["BIANCHI PARTICULAR EST MAL 2020 DOBMAGNUM", "BIANCHI PARTICULAR EST MAL DOBMAGNUM", 2020],
    ["JOSE ZUCCARDI MAL 2013 1500CC", "JOSE ZUCCARDI MAL 1500CC", 2013],
    ["ZUCCARDI TITO BLEND 2017 1500C", "ZUCCARDI TITO BLEND 1500C", 2017],
    ["ZUCCARDI CONCRETO 2016 1500", "ZUCCARDI CONCRETO 1500", 2016],
    // Año de dos cifras al final.
    ["EL ENEMIGO BON 19", "EL ENEMIGO BON", 2019],
    ["BARON B ESP HERITAGE 05", "BARON B ESP HERITAGE", 2005],
    // Números que no son años.
    ["VISTALBA CUARTEL 41", "VISTALBA CUARTEL 41", null],
    ["SEPTIMA LOTE ESP PARCELA 10", "SEPTIMA LOTE ESP PARCELA 10", null],
    ["HUENTALA BLOCK 19 MAL AUSTRAL", "HUENTALA BLOCK 19 MAL AUSTRAL", null],
    ["LAS FINCAS 1955 MAL", "LAS FINCAS 1955 MAL", null],
    ["PYROS BLOCK N4 MAL", "PYROS BLOCK N4 MAL", null],
  ])("%s → %s, %s", (descripcion, clave, anio) => {
    expect(separarAnada(descripcion)).toEqual({ clave, anio });
  });
});

const articulo = (codigo: string, descripcion: string, tipo: ArticuloTango["tipo"] = "vino"): ArticuloTango => ({
  codigo,
  descripcion,
  codigoBarras: null,
  codigoBarrasInvalido: null,
  precio: 1000,
  tipo,
});

describe("agrupar", () => {
  it("junta las añadas de un mismo vino y separa tamaños; los demás tipos van uno por producto", () => {
    const grupos = agrupar([
      articulo("VIrut0015", "RUTINI MAL 2020"),
      articulo("VIrut0080", "RUTINI MAL 2023"),
      articulo("VIrut0001", "RUTINI CAB SAUV"),
      articulo("VIzuc0009", "ZUCCARDI TITO BLEND"),
      articulo("VIzuc0010", "ZUCCARDI TITO BLEND 2014 MAGNUM"),
      articulo("VIkit0001", "2024 BOX 1 - TRUMPETER", "combo"),
      articulo("BAgle0001", "W GLENMORANGIE ORIGINAL", "destilado"),
      articulo("BAgle0002", "W GLENMORANGIE ORIGINAL", "destilado"),
    ]);
    expect(grupos.map((g) => [g.clave, g.tipo, g.articulos.map((a) => [a.codigo, a.anio])])).toEqual([
      ["RUTINI MAL", "vino", [["VIrut0015", 2020], ["VIrut0080", 2023]]],
      ["RUTINI CAB SAUV", "vino", [["VIrut0001", null]]],
      ["ZUCCARDI TITO BLEND", "vino", [["VIzuc0009", null]]],
      ["ZUCCARDI TITO BLEND MAGNUM", "vino", [["VIzuc0010", 2014]]],
      ["VIkit0001", "combo", [["VIkit0001", null]]],
      ["BAgle0001", "destilado", [["BAgle0001", null]]],
      ["BAgle0002", "destilado", [["BAgle0002", null]]],
    ]);
  });

  it("las descripciones repetidas sin año quedan como dos añadas sin especificar del mismo vino", () => {
    const [g] = agrupar([articulo("VIzuc0073", "ZUCCARDI Q MAL"), articulo("VIzuc0120", "ZUCCARDI Q MAL")]);
    expect(g.articulos.map((a) => [a.codigo, a.anio])).toEqual([["VIzuc0073", null], ["VIzuc0120", null]]);
  });

  it("si dos artículos del mismo vino tienen el mismo año, el segundo queda sin especificar y se avisa", () => {
    const [g] = agrupar([articulo("VIvig0010", "G ENEMIGO AGRELO CAB FRANC 19"), articulo("VIvig0020", "G ENEMIGO AGRELO CAB FRANC 19")]);
    expect(g.articulos.map((a) => [a.codigo, a.anio])).toEqual([["VIvig0010", 2019], ["VIvig0020", null]]);
    expect(g.problemas).toEqual(["VIvig0020: misma añada (2019) que VIvig0010; queda sin especificar."]);
  });

  it("no agrupa artículos que no se importan", () => {
    expect(agrupar([articulo("ARca0021", "lomo sin cordon", null)])).toEqual([]);
  });
});
