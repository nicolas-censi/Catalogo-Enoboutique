import { describe, expectTypeOf, it } from "vitest";
import type { Database } from "@/lib/tipos-db";

type Publico = Database["public"];

// Estas comprobaciones las valida `npm run typecheck`: si los tipos generados no
// coinciden con el esquema esperado, el typecheck falla.
describe("tipos generados de la base", () => {
  it("incluyen los enums del modelo", () => {
    expectTypeOf<Publico["Enums"]["tipo_producto"]>().toEqualTypeOf<
      "vino" | "destilado" | "aceite" | "almacen"
    >();
    expectTypeOf<Publico["Enums"]["tipo_anada"]>().toEqualTypeOf<
      "con_anio" | "sin_especificar" | "sin_anada"
    >();
  });

  it("incluyen la carta pública con precio opcional", () => {
    expectTypeOf<Publico["Views"]["carta_publica"]["Row"]["precio"]>().toEqualTypeOf<number | null>();
  });

  it("incluyen las tablas del modelo", () => {
    expectTypeOf<keyof Publico["Tables"]>().toEqualTypeOf<
      "secciones" | "bodegas" | "productos" | "anadas" | "codigos_barras" | "personal"
    >();
  });
});
