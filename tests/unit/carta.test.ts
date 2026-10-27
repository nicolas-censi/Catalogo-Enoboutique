import { describe, expect, it } from "vitest";
import { agruparPorProducto, etiquetaAnada, type FilaCarta } from "@/lib/carta";

function fila(producto: string, anio: number | null, campos: Partial<FilaCarta> = {}): FilaCarta {
  return {
    seccion_id: "s1",
    seccion_nombre: "Cava",
    seccion_orden: 1,
    producto_id: producto,
    producto_tipo: "vino",
    producto_nombre: `Vino ${producto}`,
    bodega_nombre: "Rutini",
    varietal: "Malbec",
    descripcion: null,
    foto_path: null,
    producto_orden: 1,
    anada_id: `${producto}-${anio}`,
    anada_tipo: anio === null ? "sin_especificar" : "con_anio",
    anio,
    precio: 10000,
    ...campos,
  };
}

describe("etiquetaAnada (CA-4)", () => {
  it("muestra el año de una añada con año", () => {
    expect(etiquetaAnada("con_anio", 2020)).toBe("2020");
  });

  it.each(["sin_anada", "sin_especificar"] as const)("no muestra etiqueta para %s", (tipo) => {
    expect(etiquetaAnada(tipo, null)).toBeNull();
  });
});

describe("agruparPorProducto", () => {
  it("arma un producto por cada producto_id, respetando el orden de llegada", () => {
    const productos = agruparPorProducto([fila("b", 2021), fila("a", 2020), fila("b", 2018)]);
    expect(productos.map((p) => p.id)).toEqual(["b", "a"]);
  });

  it("ordena las añadas de la más nueva a la más vieja, con las sin año al final", () => {
    const [producto] = agruparPorProducto([fila("a", 2018), fila("a", null), fila("a", 2021)]);
    expect(producto.anadas.map((a) => a.etiqueta)).toEqual(["2021", "2018", null]);
  });

  it("copia los datos del producto y el precio de cada añada", () => {
    const [producto] = agruparPorProducto([
      fila("a", 2020, { precio: 47000, descripcion: "Gualtallary", foto_path: "a.jpg" }),
      fila("a", 2019, { precio: null }),
    ]);
    expect(producto).toEqual({
      id: "a",
      tipo: "vino",
      nombre: "Vino a",
      bodega: "Rutini",
      varietal: "Malbec",
      descripcion: "Gualtallary",
      fotoPath: "a.jpg",
      seccion: { id: "s1", nombre: "Cava" },
      anadas: [
        { id: "a-2020", etiqueta: "2020", precio: 47000 },
        { id: "a-2019", etiqueta: "2019", precio: null },
      ],
    });
  });

  it("devuelve una lista vacía si no hay filas", () => {
    expect(agruparPorProducto([])).toEqual([]);
  });
});
