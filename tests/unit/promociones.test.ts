import { describe, expect, it } from "vitest";
import { rutaPromocion, validarArchivoPromocion } from "@/lib/admin/promociones";

// Spec 013, CA-6.
describe("validarArchivoPromocion", () => {
  it("acepta JPG, PNG y WebP de hasta 5 MB", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) expect(validarArchivoPromocion({ type, size: 5 * 1024 * 1024 })).toBeNull();
  });
  it("rechaza otros formatos y archivos de más de 5 MB", () => {
    expect(validarArchivoPromocion({ type: "image/svg+xml", size: 10 })).toBe("Elegí imágenes JPG, PNG o WebP.");
    expect(validarArchivoPromocion({ type: "image/png", size: 5 * 1024 * 1024 + 1 })).toBe("Una de las imágenes pesa más de 5 MB.");
  });
});

describe("rutaPromocion", () => {
  it("cada imagen tiene un nombre nuevo", () => {
    expect(rutaPromocion("webp")).toMatch(/^promos\/[0-9a-f-]{36}\.webp$/);
  });
});
