import { describe, expect, it } from "vitest";
import { traducirError } from "@/lib/admin/errores";

const dup = (restriccion: string, detalle: string) => ({
  code: "23505",
  message: `duplicate key value violates unique constraint "${restriccion}"`,
  details: detalle,
});

describe("traducirError (CA-5, CA-6)", () => {
  it("código de Tango repetido", () => {
    expect(traducirError(dup("anadas_codigo_tango_key", "Key (codigo_tango)=(VIrut0015) already exists."))).toBe(
      "Ya existe una añada con el código VIrut0015.",
    );
  });

  it("año repetido en el mismo vino", () => {
    expect(
      traducirError(dup("anadas_producto_anio_unico", "Key (producto_id, anio)=(5eed0000-0000-4000-8000-000000000201, 2020) already exists.")),
    ).toBe("Este vino ya tiene la añada 2020.");
  });

  it("código de barras de otro producto, con el nombre si se conoce", () => {
    const error = dup("codigos_barras_pkey", "Key (codigo)=(7798074860141) already exists.");
    expect(traducirError(error, { productoDelCodigo: "Salentein Primus Malbec" })).toBe(
      "El código 7798074860141 ya es de Salentein Primus Malbec.",
    );
    expect(traducirError(error)).toBe("El código 7798074860141 ya es de otro producto.");
  });

  it("bodega repetida", () => {
    expect(traducirError(dup("bodegas_nombre_key", "Key (nombre)=(Rutini) already exists."))).toBe("Ya existe la bodega Rutini.");
  });

  it("presentación única de productos que no son vino", () => {
    expect(
      traducirError({ code: "23514", message: "Un producto de tipo aceite admite una sola presentación.", details: null }),
    ).toBe("Un aceite tiene una sola presentación, sin año.");
    expect(
      traducirError({
        code: "23514",
        message: "Un producto de tipo destilado no lleva añada: la presentación tiene que ser sin_anada.",
        details: null,
      }),
    ).toBe("Un destilado tiene una sola presentación, sin año.");
  });

  it("sin permiso", () => {
    expect(traducirError({ code: "42501", message: "permission denied", details: null })).toBe("No tenés permiso para hacer esto.");
  });

  it("cualquier otro error", () => {
    expect(traducirError({ code: "XX000", message: "algo raro", details: null })).toBe("No se pudo guardar. Probá de nuevo.");
  });
});
