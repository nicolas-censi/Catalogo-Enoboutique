import { describe, expect, it } from "vitest";
import { filasDeCsv, leerReporte, tipoPorCodigo } from "@/lib/tango/reporte";

const ENCABEZADO = ["Cód. artículo", "Descripción", "Código de barras", "Precio"];

describe("tipoPorCodigo (CA-2)", () => {
  it.each([
    ["VIsal0001", "vino"],
    ["VIkit0012", "combo"],
    ["BAzzz0001", "destilado"],
    ["ALabc0001", "almacen"],
    ["ABmil0001", "almacen"],
    ["ACzuc0001", "aceite"],
    ["ARca0021", null],
    ["PR0001", null],
    ["010001", null],
    ["CE0001", null],
  ])("%s → %s", (codigo, tipo) => {
    expect(tipoPorCodigo(codigo)).toBe(tipo);
  });
});

describe("leerReporte (CA-1, CA-9)", () => {
  it("lee las cuatro columnas, limpia espacios y saltea filas vacías", () => {
    const r = leerReporte([
      ENCABEZADO,
      [" VIrut0080 ", "RUTINI MAL 2023 ", "7790000000001", 36000],
      [null, null, null, null],
      ["BAzzz0001", "W J WALKER RED 750CC", null, 25000.5],
    ]);
    expect(r.faltan).toEqual([]);
    expect(r.articulos).toEqual([
      { codigo: "VIrut0080", descripcion: "RUTINI MAL 2023", codigoBarras: "7790000000001", codigoBarrasInvalido: null, precio: 36000, tipo: "vino" },
      { codigo: "BAzzz0001", descripcion: "W J WALKER RED 750CC", codigoBarras: null, codigoBarrasInvalido: null, precio: 25000.5, tipo: "destilado" },
    ]);
  });

  it("encuentra las columnas aunque cambien de orden, de mayúsculas o de tildes", () => {
    const r = leerReporte([["PRECIO", "codigo de barras", "DESCRIPCION", "Cod. Articulo"], [100, null, "X", "ALx0001"]]);
    expect(r.faltan).toEqual([]);
    expect(r.articulos[0]).toMatchObject({ codigo: "ALx0001", descripcion: "X", precio: 100 });
  });

  it("avisa qué columnas faltan", () => {
    expect(leerReporte([["Cód. artículo", "Descripción"], ["VIx0001", "X"]]).faltan).toEqual(["Código de barras", "Precio"]);
    expect(leerReporte([]).faltan).toEqual(["Cód. artículo", "Descripción", "Código de barras", "Precio"]);
  });

  it("precio en cero, vacío o negativo queda sin precio; acepta precios con formato argentino", () => {
    const precios = leerReporte([
      ENCABEZADO,
      ["VIa0001", "A", null, 0],
      ["VIa0002", "B", null, null],
      ["VIa0003", "C", null, "37.000,50"],
      ["VIa0004", "D", null, "-5"],
    ]).articulos.map((a) => a.precio);
    expect(precios).toEqual([null, null, 37000.5, null]);
  });

  it("un código de barras inválido se separa para avisarlo", () => {
    const [a] = leerReporte([ENCABEZADO, ["VIa0001", "A", " 37726", 10]]).articulos;
    expect(a).toMatchObject({ codigoBarras: null, codigoBarrasInvalido: "37726" });
  });

  it("un código de artículo repetido o una descripción vacía se avisa como problema", () => {
    const r = leerReporte([ENCABEZADO, ["VIa0001", "A", null, 10], ["VIa0001", "B", null, 10], ["VIa0002", "  ", null, 10]]);
    expect(r.articulos.map((a) => a.codigo)).toEqual(["VIa0001"]);
    expect(r.problemas).toEqual(["VIa0001: el código está repetido en el archivo.", "VIa0002: no tiene descripción."]);
  });
});

describe("filasDeCsv (CA-1)", () => {
  it("lee CSV separado por punto y coma o por coma, con comillas", () => {
    expect(filasDeCsv('Cód. artículo;Descripción;Código de barras;Precio\nVIa0001;"RUTINI; MAL";;"36.000,00"\n')).toEqual([
      ["Cód. artículo", "Descripción", "Código de barras", "Precio"],
      ["VIa0001", "RUTINI; MAL", "", "36.000,00"],
    ]);
    expect(filasDeCsv('a,b\r\n"x ""y""",2\r\n')).toEqual([
      ["a", "b"],
      ['x "y"', "2"],
    ]);
  });
});
