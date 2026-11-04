import { describe, expect, it } from "vitest";
import { formatearPrecio } from "@/lib/formato";
import { textos } from "@/lib/textos";

// Intl separa el signo del número con un espacio duro (U+00A0).
const esp = " ";

describe("formatearPrecio", () => {
  it("formatea en pesos con separador de miles es-AR", () => {
    expect(formatearPrecio(47000)).toBe(`$${esp}47.000`);
  });

  it("formatea millones", () => {
    expect(formatearPrecio(1250000)).toBe(`$${esp}1.250.000`);
  });

  it("formatea el cero", () => {
    expect(formatearPrecio(0)).toBe(`$${esp}0`);
  });

  it("no muestra decimales", () => {
    expect(formatearPrecio(47000.4)).toBe(`$${esp}47.000`);
  });

  it('sin precio muestra "Consultar precio"', () => {
    expect(formatearPrecio(null)).toBe("Consultar precio");
    expect(textos.consultarPrecio).toBe("Consultar precio");
  });
});

describe("formatearDolares", () => {
  it("dos decimales al estilo argentino; lo chico no queda en cero", async () => {
    const { formatearDolares } = await import("@/lib/formato");
    expect(formatearDolares(12.4)).toBe("12,40");
    expect(formatearDolares(1234.5)).toBe("1.234,50");
    expect(formatearDolares(0.003)).toBe("0,01");
    expect(formatearDolares(0)).toBe("0,00");
  });
});
