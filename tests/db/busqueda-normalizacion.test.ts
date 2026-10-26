import { describe, expect, it } from "vitest";
import { ejecutarSql } from "@/scripts/api-sql.mjs";

const literal = (texto: string) => `'${texto.replaceAll("'", "''")}'`;

async function normalizar(texto: string): Promise<string> {
  const [fila] = await ejecutarSql(`select public.normalizar_busqueda(${literal(texto)}) as r`);
  return fila.r;
}

describe("CA-5: base de la búsqueda", () => {
  it("instala pg_trgm y unaccent en el esquema extensions", async () => {
    const filas = await ejecutarSql(`
      select e.extname, n.nspname from pg_extension e
      join pg_namespace n on n.oid = e.extnamespace
      where e.extname in ('pg_trgm', 'unaccent') order by e.extname`);
    expect(filas).toEqual([
      { extname: "pg_trgm", nspname: "extensions" },
      { extname: "unaccent", nspname: "extensions" },
    ]);
  });

  it.each([
    ["Salentéin PRIMUS", "salentein primus"],
    ["ALMACÉN", "almacen"],
    ["  Costa  &  Pampa ", "costa & pampa"],
    ["Ñandú", "nandu"],
  ])("normaliza %j como %j (sin tildes, minúsculas, espacios simples)", async (texto, esperado) => {
    expect(await normalizar(texto)).toBe(esperado);
  });

  it("devuelve vacío para null", async () => {
    const [fila] = await ejecutarSql("select public.normalizar_busqueda(null) as r");
    expect(fila.r).toBe("");
  });

  it("tiene índices de trigramas sobre productos y bodegas", async () => {
    const filas = await ejecutarSql(`
      select tablename from pg_indexes
      where schemaname = 'public' and indexdef ilike '%gin_trgm_ops%'
      order by tablename`);
    expect(filas.map((f: { tablename: string }) => f.tablename)).toEqual(["bodegas", "productos"]);
  });

  it("la función no se puede llamar desde la API pública", async () => {
    const [fila] = await ejecutarSql(`
      select has_function_privilege('anon', 'public.normalizar_busqueda(text)', 'execute') as anon`);
    expect(fila.anon).toBe(false);
  });
});
