import { describe, expect, it } from "vitest";
import { DICCIONARIO_INICIAL } from "@/lib/tango/nombres";
import { planear, type EstadoActual } from "@/lib/tango/plan";
import { leerReporte } from "@/lib/tango/reporte";

// Spec 008, CA-3 y CA-5 a CA-9.
const ENC = ["Cód. artículo", "Descripción", "Código de barras", "Precio"];
const reporte = (...filas: unknown[][]) => leerReporte([ENC, ...filas]);
const vacio: EstadoActual = { primera: true, anadas: [], bodegas: [], secciones: [], codigosBarras: [] };
const plan = (estado: EstadoActual, ...filas: unknown[][]) => planear(reporte(...filas), estado, DICCIONARIO_INICIAL, 2026);

describe("primera importación (CA-7)", () => {
  const p = plan(
    vacio,
    ["VIrut0015", "RUTINI MAL 2020", "7790001", 47000],
    ["VIrut0080", "RUTINI MAL 2023", "77900000001", 36000],
    ["VIrut0001", "RUTINI CAB SAUV", null, 0],
    ["VIkit0001", "2024 BOX 1 - TRUMPETER", null, 50000],
    ["BAgle0001", "W GLENMORANGIE ORIGINAL", "5010494000001", 90000],
    ["VIxxx0001", "CONFIADO ANFORA", null, 10000],
    ["ARca0021", "lomo sin cordon", null, 31776.26],
  );

  it("crea un producto por vino, con sus añadas disponibles y visible", () => {
    const rutini = p.productosNuevos.find((x) => x.nombre === "Rutini Malbec")!;
    expect(rutini).toMatchObject({ tipo: "vino", varietal: "Malbec", bodegaCodigo: "rut", seccion: "Tintos", visible: true, codigosBarras: ["77900000001"] });
    expect(rutini.anadas).toEqual([
      { codigo: "VIrut0015", descripcion: "RUTINI MAL 2020", tipo: "con_anio", anio: 2020, precio: 47000, enStock: true },
      { codigo: "VIrut0080", descripcion: "RUTINI MAL 2023", tipo: "con_anio", anio: 2023, precio: 36000, enStock: true },
    ]);
    expect(p.productosNuevos.find((x) => x.nombre === "Rutini Cabernet Sauvignon")!.anadas).toEqual([
      { codigo: "VIrut0001", descripcion: "RUTINI CAB SAUV", tipo: "sin_especificar", anio: null, precio: null, enStock: true },
    ]);
  });

  it("combos y destilados: una presentación sin añada, en su sección", () => {
    expect(p.productosNuevos.find((x) => x.anadas[0].codigo === "VIkit0001")).toMatchObject({
      tipo: "vino",
      nombre: "2024 Box 1 - Trumpeter",
      seccion: "Combos y boxes",
      bodegaCodigo: null,
      anadas: [{ tipo: "sin_anada", anio: null }],
    });
    expect(p.productosNuevos.find((x) => x.anadas[0].codigo === "BAgle0001")).toMatchObject({
      tipo: "destilado",
      nombre: "Whisky Glenmorangie Original",
      varietal: null,
      seccion: "Destilados",
      codigosBarras: ["5010494000001"],
    });
  });

  it("crea las bodegas y secciones que faltan, y lo dudoso queda sin sección", () => {
    expect(p.bodegasNuevas).toEqual([
      { codigo: "rut", nombre: "Rutini", existenteId: null },
      { codigo: "xxx", nombre: "Confiado", existenteId: null },
    ]);
    expect(p.seccionesNuevas).toEqual(["Tintos", "Combos y boxes", "Destilados"]);
    expect(p.productosNuevos.find((x) => x.nombre === "Confiado Anfora")!.seccion).toBeNull();
  });

  it("el resumen cuenta lo que no se importa y avisa los problemas", () => {
    expect(p.resumen).toMatchObject({ productosNuevos: 5, anadasNuevas: 6, preciosCambian: 0, sinCambios: 0, noSeImportan: 1, sinSeccion: 1 });
    expect(p.resumen.problemas).toEqual(["VIrut0015: el código de barras «7790001» no es válido; no se importa."]);
  });
});

describe("actualización (CA-8)", () => {
  const estado: EstadoActual = {
    primera: false,
    anadas: [
      { codigo: "VIrut0015", productoId: "p-rutini", nombreProducto: "Rutini Malbec", tipoProducto: "vino", descripcion: "RUTINI MAL 2020", anio: 2020, precio: 47000 },
      { codigo: "VIrut0080", productoId: "p-rutini", nombreProducto: "Rutini Malbec", tipoProducto: "vino", descripcion: "RUTINI MAL 2023", anio: 2023, precio: 36000 },
      { codigo: "VIviejo01", productoId: "p-viejo", nombreProducto: "Vino viejo", tipoProducto: "vino", descripcion: "VINO VIEJO", anio: null, precio: 1 },
    ],
    bodegas: [{ id: "b-rut", codigo: "rut", nombre: "Rutini" }, { id: "b-zuc", codigo: null, nombre: "Zuccardi" }],
    secciones: [
      { id: "s-tintos", nombre: "Tintos", tieneSubsecciones: false },
      { id: "s-cava", nombre: "Blancos", tieneSubsecciones: true },
    ],
    codigosBarras: [{ codigo: "77900000001", productoId: "p-rutini" }],
  };
  const p = plan(
    estado,
    ["VIrut0015", "RUTINI MAL 2020", null, 49000], // sube
    ["VIrut0080", "RUTINI MAL 2023", "77900000001", 36000], // igual
    ["VIrut0090", "RUTINI MAL 2024", "77900000002", 33000], // añada nueva de un vino que ya está
    ["VIzuc0001", "ZUCCARDI Q MAL", null, 20000], // producto nuevo
    ["VIzuc0002", "ZUCCARDI Q CHARDO", null, 20000], // va a una sección con subsecciones
  );

  it("actualiza precios y no toca lo que no cambió", () => {
    expect(p.precios).toEqual([{ codigo: "VIrut0015", anterior: 47000, nuevo: 49000 }]);
    expect(p.resumen.sinCambios).toBe(1);
  });

  it("una añada nueva de un vino existente se suma sin stock; un producto nuevo entra oculto", () => {
    expect(p.anadasNuevas).toEqual([
      { productoId: "p-rutini", codigo: "VIrut0090", descripcion: "RUTINI MAL 2024", tipo: "con_anio", anio: 2024, precio: 33000, enStock: false },
    ]);
    expect(p.codigosBarrasNuevos).toEqual([{ productoId: "p-rutini", codigo: "77900000002" }]);
    expect(p.productosNuevos.map((x) => [x.nombre, x.visible, x.seccion])).toEqual([
      ["Zuccardi Q Malbec", false, "Tintos"],
      ["Zuccardi Q Chardonnay", false, null],
    ]);
  });

  it("reusa la bodega con el mismo nombre y le asigna el código", () => {
    expect(p.bodegasNuevas).toEqual([{ codigo: "zuc", nombre: "Zuccardi", existenteId: "b-zuc" }]);
    expect(p.seccionesNuevas).toEqual([]);
  });

  it("lista lo que está en la carta y no en el archivo, sin tocarlo", () => {
    expect(p.resumen.faltanEnArchivo).toEqual(["VIviejo01"]);
  });

  it("una añada nueva con un año que el vino ya tiene queda sin especificar y se avisa", () => {
    const q = plan(estado, ["VIrut0099", "RUTINI MAL 2020 ", null, 1]);
    expect(q.anadasNuevas[0]).toMatchObject({ tipo: "sin_especificar", anio: null });
    expect(q.resumen.problemas).toEqual(["VIrut0099: Rutini Malbec ya tiene la añada 2020; queda sin especificar."]);
  });

  it("un código de barras que ya es de otro producto no se repite", () => {
    const q = plan(estado, ["VIzuc0005", "ZUCCARDI FOSIL", "77900000001", 1]);
    expect(q.productosNuevos[0].codigosBarras).toEqual([]);
    expect(q.resumen.problemas).toEqual(["VIzuc0005: el código de barras 77900000001 ya es de otro producto; no se importa."]);
  });
});

describe("bodegas con el mismo nombre sugerido", () => {
  it("la segunda lleva el código para no repetir el nombre", () => {
    const p = plan(vacio, ["VIcyt0001", "CALLEJ DE BRUJAS MAL", null, 1], ["VIcdc0001", "CALLEJ DEL CRIMEN MAL", null, 1]);
    expect(p.bodegasNuevas).toEqual([
      { codigo: "cyt", nombre: "Callejón", existenteId: null },
      { codigo: "cdc", nombre: "Callejón (cdc)", existenteId: null },
    ]);
  });
});
