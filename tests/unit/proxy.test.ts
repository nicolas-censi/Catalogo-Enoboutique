import { describe, expect, it } from "vitest";
// Next.js 16 todavía llama "middleware" a esta utilidad de test del proxy.
import { unstable_doesMiddlewareMatch as coincide } from "next/experimental/testing/server";
import { config } from "@/proxy";

describe("proxy.ts", () => {
  it.each(["/admin", "/admin/ingresar", "/admin/productos/123"])("corre en %s", (url) => {
    expect(coincide({ config, url })).toBe(true);
  });

  it.each(["/", "/seccion/abc", "/producto/abc", "/buscar?q=rutini"])(
    "no corre en la carta pública (%s), que se cachea y no usa sesión",
    (url) => {
      expect(coincide({ config, url })).toBe(false);
    },
  );
});
