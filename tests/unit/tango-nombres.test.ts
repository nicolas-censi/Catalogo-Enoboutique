import { describe, expect, it } from "vitest";
import { DICCIONARIO_INICIAL, nombreLegible, varietal } from "@/lib/tango/nombres";

// Spec 008, CA-4. Casos del reporte real de Tango.
const d = DICCIONARIO_INICIAL;

describe("nombreLegible", () => {
  it.each([
    ["SALENTEIN PRIMUS MAL", "Salentein Primus Malbec"],
    ["TRAPICHE G MEDALLA CAB SAUV", "Trapiche Gran Medalla Cabernet Sauvignon"],
    ["SALENTEIN RVA P NOIR", "Salentein Reserva Pinot Noir"],
    ["RUTINI SV GUALTA MAL", "Rutini Single Vineyard Gualtallary Malbec"],
    ["CHANDON ESP EX BRUT 375CC", "Chandon Espumante Extra Brut 375 cc"],
    ["TRAPICHE MEDALLA ESP BRUT NAT", "Trapiche Medalla Espumante Brut Nature"],
    ["ESC GASCON PEQ PROD MAL", "Escorihuela Gascón Pequeñas Producciones Malbec"],
    ["FCA FLICHMAN G RVA MER", "Finca Flichman Gran Reserva Merlot"],
    ["STA JULIA EL BURRO MAL", "Santa Julia El Burro Malbec"],
    ["L BOSCA DE SANGRE MAL", "Luigi Bosca de Sangre Malbec"],
    ["ZUCCARDI Q MAL", "Zuccardi Q Malbec"],
    ["W J WALKER RED 750CC", "Whisky J Walker Red 750 cc"],
    ["AOVE ZUCCARDI PICUAL 500CC", "AOVE Zuccardi Picual 500 cc"],
    ["LAMADRID ZUN ZUN EST MIX X3", "Lamadrid Zun Zun Est Mix x3"],
    ["BIANCHI STRADIVARIUS SEM DULCE", "Bianchi Stradivarius Semillón Dulce"],
    ["CHANDON ESP DELICE ROSE", "Chandon Espumante Delice Rosé"],
    ["lomo sin cordon", "Lomo Sin Cordon"],
    ["MIMI MAL-MER", "Mimi Malbec - Merlot"],
    ["APARTADO G CAB", "Apartado Gran Cabernet"],
    ["CH VEUVE CLICQUOT LA G DAME", "Champagne Veuve Clicquot La Gran Dame"],
  ])("%s → %s", (descripcion, nombre) => {
    expect(nombreLegible(descripcion, d)).toBe(nombre);
  });
});

describe("varietal", () => {
  it.each([
    ["SALENTEIN PRIMUS MAL", "Malbec"],
    ["TRAPICHE G MEDALLA CAB SAUV", "Cabernet Sauvignon"],
    ["HJ FABRE M MAL - P NOIR", "Malbec, Pinot Noir"],
    ["RUTINI DOMINIO G BLEND", "Blend"],
    ["SALENTEIN RVA C TINTAS", null],
    ["ZUCCARDI Q MAL MAL", "Malbec"],
    ["MIMI MAL-MER", "Malbec, Merlot"],
    ["IMPACIENTE CAB SAUVI", "Cabernet Sauvignon"],
  ])("%s → %s", (descripcion, esperado) => {
    expect(varietal(descripcion, d)).toBe(esperado);
  });
});

describe("diccionario", () => {
  it("no repite abreviaturas y todas están en mayúsculas", () => {
    const abreviaturas = d.map((e) => e.abreviatura);
    expect(new Set(abreviaturas).size).toBe(abreviaturas.length);
    expect(abreviaturas.every((a) => a === a.toUpperCase())).toBe(true);
  });

  it("usa el diccionario que recibe (el que edita el encargado)", () => {
    expect(nombreLegible("NORTON MAL", [{ abreviatura: "MAL", expansion: "Malbec Argentino", esVarietal: true }])).toBe("Norton Malbec Argentino");
  });
});
