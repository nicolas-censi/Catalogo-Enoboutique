import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { ejecutarSql } from "@/scripts/api-sql.mjs";
import { clienteAnon } from "./ayudante";

type Fila = { producto_nombre: string; seccion_nombre: string; anio: number | null; precio: number | null };

let carta: Fila[] = [];

beforeAll(async () => {
  // El seed es idempotente: se puede aplicar las veces que haga falta.
  const seed = readFileSync(join(process.cwd(), "supabase", "seed.sql"), "utf8");
  await ejecutarSql(seed);
  await ejecutarSql(seed);
  const { data, error } = await clienteAnon()
    .from("carta_publica")
    .select("producto_nombre, seccion_nombre, anio, precio")
    .order("seccion_orden")
    .order("producto_orden")
    .order("anio", { ascending: false, nullsFirst: false });
  if (error) throw error;
  carta = data;
});

const de = (producto: string) => carta.filter((f) => f.producto_nombre === producto);

describe("seed con datos reales del export de Tango", () => {
  it("CA-3: Rutini Malbec aparece una vez con sus añadas disponibles", () => {
    expect(de("Rutini Malbec").map((f) => [f.anio, f.precio])).toEqual([
      [2023, 36000],
      [2022, 40000],
      [2021, 43000],
      [2020, 47000],
      [2018, 54000],
    ]);
  });

  it("incluye añadas sin especificar, para revisar (Zuccardi Q Malbec)", () => {
    const sinAnio = de("Zuccardi Q Malbec").filter((f) => f.anio === null);
    expect(sinAnio.map((f) => f.precio).sort()).toEqual([20500, 69600]);
  });

  it('incluye una añada sin precio, que se muestra como "Consultar precio"', () => {
    expect(de("Costa & Pampa Sauvignon Blanc")).toEqual([
      expect.objectContaining({ anio: 2016, precio: null }),
    ]);
  });

  it("incluye un destilado, un aceite y un producto de almacén", () => {
    for (const producto of ["Glenmorangie Original", "AOVE Zuccardi Picual 500 cc", "Sal gourmet Salva Malbec"]) {
      expect(de(producto), producto).toHaveLength(1);
    }
  });

  it("la sección oculta no aparece en la carta", () => {
    expect(carta.map((f) => f.seccion_nombre)).not.toContain("Próximamente");
  });

  it("CA-5: el código de barras de Salentein Primus Malbec devuelve todas sus añadas", async () => {
    const { data } = await clienteAnon().rpc("buscar_por_codigo_barras", { codigo: "7798074860141" });
    expect(data).toHaveLength(4);
  });
});
