import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { DICCIONARIO_INICIAL } from "@/lib/tango/nombres";

// Spec 008, CA-4: la última migración del diccionario carga el mismo que usa el código.
it("el diccionario inicial de la base es el de lib/tango/nombres.ts", () => {
  const sql = readFileSync("supabase/migrations/20261029140000_lista_lehonor.sql", "utf8");
  const filas = [...sql.matchAll(/^\s+\('((?:[^']|'')+)', '((?:[^']|'')+)', (true|false)\)/gm)].map((m) => ({
    abreviatura: m[1].replace(/''/g, "'"),
    expansion: m[2].replace(/''/g, "'"),
    esVarietal: m[3] === "true",
  }));
  expect(filas).toEqual(DICCIONARIO_INICIAL);
});
