import { describe, expect, it } from "vitest";
import { rutaLogo, validarArchivoLogo, validarBienvenida } from "@/lib/admin/marca";

// Spec 006, CA-1 y CA-2.
describe("validarBienvenida", () => {
  it("limpia espacios y deja vacía como null (no se muestra)", () => {
    expect(validarBienvenida("  Bienvenidos a nuestra cava  ")).toEqual({ bienvenida: "Bienvenidos a nuestra cava", error: null });
    expect(validarBienvenida("   ")).toEqual({ bienvenida: null, error: null });
  });

  it("acepta hasta 200 caracteres", () => {
    expect(validarBienvenida("a".repeat(200)).error).toBeNull();
    expect(validarBienvenida("a".repeat(201)).error).toBe("La bienvenida puede tener hasta 200 caracteres.");
  });
});

describe("validarArchivoLogo", () => {
  it("acepta PNG y WebP de hasta 2 MB", () => {
    expect(validarArchivoLogo({ type: "image/png", size: 500_000 })).toBeNull();
    expect(validarArchivoLogo({ type: "image/webp", size: 2 * 1024 * 1024 })).toBeNull();
  });

  it("rechaza otros formatos, también SVG", () => {
    const error = "Elegí una imagen PNG o WebP (mejor con fondo transparente).";
    expect(validarArchivoLogo({ type: "image/svg+xml", size: 1000 })).toBe(error);
    expect(validarArchivoLogo({ type: "image/jpeg", size: 1000 })).toBe(error);
  });

  it("rechaza archivos de más de 2 MB", () => {
    expect(validarArchivoLogo({ type: "image/png", size: 2 * 1024 * 1024 + 1 })).toBe("El logo pesa más de 2 MB.");
  });
});

describe("rutaLogo", () => {
  it("cada logo tiene un nombre nuevo, así el navegador no muestra el anterior", () => {
    expect(rutaLogo("png")).toMatch(/^logos\/[0-9a-f-]{36}\.png$/);
    expect(rutaLogo("png")).not.toBe(rutaLogo("png"));
  });
});
