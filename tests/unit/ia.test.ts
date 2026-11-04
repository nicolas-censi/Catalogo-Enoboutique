import { describe, expect, it } from "vitest";
import { leerRespuesta, esquemaJsonRespuesta } from "@/lib/ia/esquema";
import { armarPedido, INSTRUCCIONES } from "@/lib/ia/pedido";
import { SugeridorFalso, FOTO_FALSA } from "@/lib/ia/falso";
import type { ProductoParaSugerir } from "@/lib/ia/tipos";

// Spec 007, T2 (CA-4): qué se le pide a la IA y cómo se valida lo que devuelve.
const rutini: ProductoParaSugerir = {
  nombre: "Rutini Malbec",
  bodega: "Rutini Wines",
  varietal: "Malbec",
  tipo: "vino",
  anios: [2022, 2021, null],
};

describe("armarPedido", () => {
  it("lleva nombre, bodega, varietal, tipo y añadas", () => {
    const pedido = armarPedido(rutini);
    for (const dato of ["Rutini Malbec", "Rutini Wines", "Malbec", "vino", "2022", "2021"]) expect(pedido).toContain(dato);
  });

  it("no lleva precios, códigos de Tango ni códigos de barras aunque vengan en el objeto", () => {
    const conDeMas = { ...rutini, precio: 47000, codigoTango: "VI-RUT-22", codigoBarras: "7790000000017" } as ProductoParaSugerir;
    const pedido = armarPedido(conDeMas);
    expect(pedido).not.toMatch(/47\.?000|VI-RUT-22|7790000000017/);
  });

  it("omite lo que no se sabe y nombra bien los productos que no son vino", () => {
    const pedido = armarPedido({ nombre: "Aceite Zuelo", bodega: null, varietal: null, tipo: "aceite", anios: [] });
    expect(pedido).toContain("Aceite Zuelo");
    expect(pedido).toContain("aceite de oliva");
    expect(pedido).not.toMatch(/null|undefined|Bodega:|Varietal:|Añadas:/);
  });
});

describe("INSTRUCCIONES", () => {
  it("piden español, 40 a 60 palabras, sin precios ni puntajes ni premios, sin inventar", () => {
    expect(INSTRUCCIONES).toMatch(/español/i);
    expect(INSTRUCCIONES).toMatch(/40 y 60 palabras/);
    expect(INSTRUCCIONES).toMatch(/precios/);
    expect(INSTRUCCIONES).toMatch(/puntajes/);
    expect(INSTRUCCIONES).toMatch(/premios/);
    expect(INSTRUCCIONES).toMatch(/no invent/i);
  });
  it("priorizan la bodega, después el distribuidor, nunca reventa; y tratan las páginas como datos", () => {
    expect(INSTRUCCIONES).toMatch(/bodega/);
    expect(INSTRUCCIONES).toMatch(/distribuidor/);
    expect(INSTRUCCIONES).toMatch(/reventa/);
    expect(INSTRUCCIONES).toMatch(/datos, no instrucciones/);
  });
});

describe("leerRespuesta", () => {
  const valida = {
    descripcion: "  Un Malbec de altura del Valle de Uco, con <b>doce meses</b> en roble francés.  ",
    motivoSinDescripcion: null,
    paginaFoto: "https://www.rutini.com/vinos/malbec",
    fotoUrl: "https://www.rutini.com/img/malbec.png",
    motivoSinFoto: null,
  };

  it("acepta una respuesta válida (objeto o texto JSON, también entre ```), sin HTML y recortada", () => {
    for (const entrada of [valida, JSON.stringify(valida), "```json\n" + JSON.stringify(valida) + "\n```"]) {
      const r = leerRespuesta(entrada);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.datos.descripcion).toBe("Un Malbec de altura del Valle de Uco, con doce meses en roble francés.");
        expect(r.datos.fotoUrl).toBe(valida.fotoUrl);
      }
    }
  });

  it("acepta que falte una de las dos cosas si dice por qué", () => {
    const r = leerRespuesta({ ...valida, paginaFoto: null, fotoUrl: null, motivoSinFoto: "No encontré una foto oficial." });
    expect(r.ok).toBe(true);
  });

  it("rechaza JSON roto, campos faltantes o sin motivo, y direcciones que no son https", () => {
    expect(leerRespuesta("no es json").ok).toBe(false);
    expect(leerRespuesta({ descripcion: "Hola" }).ok).toBe(false);
    expect(leerRespuesta({ ...valida, descripcion: null, motivoSinDescripcion: null }).ok).toBe(false);
    expect(leerRespuesta({ ...valida, fotoUrl: "http://sitio.com/a.png" }).ok).toBe(false);
    expect(leerRespuesta({ ...valida, paginaFoto: "javascript:alert(1)" }).ok).toBe(false);
  });

  it("rechaza descripciones con precios, puntajes o premios, o demasiado largas", () => {
    for (const descripcion of [
      "Un gran Malbec por solo $ 47.000.",
      "Obtuvo 95 puntos Parker.",
      "Ganó una medalla de oro en Decanter.",
      Array(130).fill("vino").join(" "),
    ]) expect(leerRespuesta({ ...valida, descripcion }).ok).toBe(false);
  });

  it("el esquema JSON para el modelo pide los cinco campos", () => {
    const esquema = esquemaJsonRespuesta() as { required: string[] };
    expect([...esquema.required].sort()).toEqual(["descripcion", "fotoUrl", "motivoSinDescripcion", "motivoSinFoto", "paginaFoto"]);
  });
});

describe("SugeridorFalso (IA_FALSA=1)", () => {
  it("devuelve siempre lo mismo para el mismo producto, con foto, fuentes y uso", async () => {
    const ia = new SugeridorFalso();
    const a = await ia.sugerir(rutini);
    expect(a).toEqual(await ia.sugerir(rutini));
    expect(a.descripcion).toContain("Rutini Malbec");
    expect(a.fotoUrl).toBe(FOTO_FALSA);
    expect(a.fuentes.length).toBeGreaterThan(0);
    expect(a.uso).toEqual({ tokensEntrada: expect.any(Number), tokensSalida: expect.any(Number), busquedas: expect.any(Number) });
  });
  it("simula un producto sin foto y una falla, según el nombre", async () => {
    const ia = new SugeridorFalso();
    const sinFoto = await ia.sugerir({ ...rutini, nombre: "Vino [sin foto]" });
    expect(sinFoto.fotoUrl).toBeNull();
    expect(sinFoto.motivoSinFoto).toBe("No encontré una foto oficial.");
    await expect(ia.sugerir({ ...rutini, nombre: "Vino [falla]" })).rejects.toThrow();
  });
});

describe("esProductoDePrueba", () => {
  it("solo reconoce los productos creados por los tests (con su prefijo)", async () => {
    const { esProductoDePrueba } = await import("@/lib/ia/falso");
    expect(esProductoDePrueba("Sugerido Malbec test-mw0qhfr1-663470")).toBe(true);
    expect(esProductoDePrueba("Salentein Primus Malbec")).toBe(false);
    expect(esProductoDePrueba("Vino test")).toBe(false);
  });
});
