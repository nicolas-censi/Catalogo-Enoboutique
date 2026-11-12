import { describe, expect, it } from "vitest";
import { decidirEscaneo } from "@/lib/admin/codigo-escaneado";

// Spec 019, CA-1: qué pasa con un código leído con la cámara en la ficha de un producto.
const PRODUCTO = "p-1";

describe("decidirEscaneo", () => {
  it("si nadie lo tiene, se agrega tal cual se leyó", () => {
    expect(decidirEscaneo("7790000000017", [], PRODUCTO)).toEqual({ tipo: "agregar", codigo: "7790000000017" });
  });

  it("si ya es de este producto (también con o sin el 0 adelante), avisa que ya estaba", () => {
    expect(decidirEscaneo("7790000000017", [{ codigo: "7790000000017", productoId: PRODUCTO, nombre: "Rutini" }], PRODUCTO)).toEqual({
      tipo: "ya-estaba",
      codigo: "7790000000017",
    });
    expect(decidirEscaneo("012345678905", [{ codigo: "0012345678905", productoId: PRODUCTO, nombre: "Rutini" }], PRODUCTO)).toEqual({
      tipo: "ya-estaba",
      codigo: "0012345678905",
    });
  });

  it("si es de otro producto, dice de cuál y no se agrega", () => {
    expect(decidirEscaneo("7790000000017", [{ codigo: "7790000000017", productoId: "p-2", nombre: "Salentein Primus" }], PRODUCTO)).toEqual({
      tipo: "de-otro",
      codigo: "7790000000017",
      nombre: "Salentein Primus",
    });
  });
});
