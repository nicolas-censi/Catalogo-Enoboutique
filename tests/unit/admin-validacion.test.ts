import { describe, expect, it } from "vitest";
import { leerPrecio, validarAnada, validarCodigoBarras, validarProducto } from "@/lib/admin/validacion";

describe("validarProducto (CA-4)", () => {
  it("acepta un producto completo y limpia espacios", () => {
    const r = validarProducto({ tipo: "vino", nombre: "  Rutini Malbec ", varietal: " Malbec ", descripcion: "", visible: true });
    expect(r.errores).toEqual({});
    expect(r.datos).toMatchObject({ tipo: "vino", nombre: "Rutini Malbec", varietal: "Malbec", descripcion: null, visible: true });
  });

  it("exige tipo y nombre, con el error junto al campo", () => {
    const r = validarProducto({ tipo: "", nombre: "   " });
    expect(r.errores).toEqual({ tipo: "Elegí el tipo de producto.", nombre: "Escribí el nombre." });
  });

  it("rechaza un tipo inexistente", () => {
    expect(validarProducto({ tipo: "cerveza", nombre: "X" }).errores.tipo).toBe("Elegí el tipo de producto.");
  });
});

describe("leerPrecio", () => {
  it.each([
    ["47000", 47000],
    ["47.000", 47000],
    ["$ 47.000", 47000],
    ["1.250.000", 1250000],
    ["47000,50", 47000.5],
    ["", null],
    ["  ", null],
  ])("%j → %j", (texto, esperado) => {
    expect(leerPrecio(texto)).toBe(esperado);
  });

  it.each(["abc", "-5", "47,000,00"])("%j no es un precio válido", (texto) => {
    expect(leerPrecio(texto)).toBeNaN();
  });
});

describe("validarAnada (CA-5)", () => {
  const base = { codigoTango: "VIrut0015", descripcionTango: "RUTINI MAL 2020", tipo: "con_anio", anio: "2020", precio: "47.000", enStock: true };

  it("acepta una añada con año", () => {
    const r = validarAnada(base, "vino");
    expect(r.errores).toEqual({});
    expect(r.datos).toEqual({ codigo_tango: "VIrut0015", descripcion_tango: "RUTINI MAL 2020", tipo: "con_anio", anio: 2020, precio: 47000, en_stock: true });
  });

  it("una añada con año necesita un año válido", () => {
    expect(validarAnada({ ...base, anio: "" }, "vino").errores.anio).toBe("Escribí el año (por ejemplo, 2020).");
    expect(validarAnada({ ...base, anio: "20" }, "vino").errores.anio).toBe("Escribí el año (por ejemplo, 2020).");
  });

  it("sin especificar o sin añada no llevan año", () => {
    expect(validarAnada({ ...base, tipo: "sin_especificar", anio: "2020" }, "vino").datos?.anio).toBeNull();
  });

  it("exige el código de Tango", () => {
    expect(validarAnada({ ...base, codigoTango: " " }, "vino").errores.codigoTango).toBe("Escribí el código de Tango.");
  });

  it("rechaza un precio inválido", () => {
    expect(validarAnada({ ...base, precio: "abc" }, "vino").errores.precio).toBe("Escribí el precio en números (por ejemplo, 47.000).");
  });

  it("sin precio es válido (muestra Consultar precio)", () => {
    expect(validarAnada({ ...base, precio: "" }, "vino").datos?.precio).toBeNull();
  });

  it.each(["destilado", "aceite", "almacen"] as const)("un %s solo lleva una presentación sin año", (tipo) => {
    expect(validarAnada({ ...base, tipo: "con_anio" }, tipo).errores.tipo).toMatch(/una sola presentación, sin año/);
    expect(validarAnada({ ...base, tipo: "sin_anada", anio: "" }, tipo).errores).toEqual({});
  });
});

describe("validarCodigoBarras (CA-6)", () => {
  it("acepta entre 8 y 14 dígitos, sin espacios", () => {
    expect(validarCodigoBarras(" 7798074860141 ")).toEqual({ codigo: "7798074860141", error: null });
  });

  it.each(["123", "77980748601411234", "77980748A0141"])("rechaza %j", (codigo) => {
    expect(validarCodigoBarras(codigo).error).toBe("El código de barras tiene que tener entre 8 y 14 números.");
  });
});

import { validarContrasena } from "@/lib/admin/validacion";

describe("validarContrasena (CA-1b)", () => {
  it("acepta una contraseña de 8 o más caracteres repetida igual", () => {
    expect(validarContrasena("Malbec2026", "Malbec2026")).toEqual({});
  });
  it("rechaza contraseñas cortas", () => {
    expect(validarContrasena("corta", "corta")).toEqual({ nueva: "Tiene que tener al menos 8 caracteres." });
  });
  it("rechaza si no coinciden", () => {
    expect(validarContrasena("Malbec2026", "Malbec2025")).toEqual({ repetida: "Las contraseñas no coinciden." });
  });
});
