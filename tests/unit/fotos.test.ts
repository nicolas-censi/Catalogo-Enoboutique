import { describe, expect, it } from "vitest";
import { medidasReducidas, rutaFoto, validarArchivoFoto } from "@/lib/admin/fotos";

describe("medidasReducidas", () => {
  it("achica el lado mayor a 1600 px manteniendo la proporción", () => {
    expect(medidasReducidas(2400, 3200)).toEqual({ ancho: 1200, alto: 1600 });
    expect(medidasReducidas(4000, 3000)).toEqual({ ancho: 1600, alto: 1200 });
  });

  it("no agranda fotos chicas", () => {
    expect(medidasReducidas(300, 400)).toEqual({ ancho: 300, alto: 400 });
  });
});

describe("validarArchivoFoto (CA-7)", () => {
  it("acepta imágenes de hasta 10 MB", () => {
    expect(validarArchivoFoto({ type: "image/jpeg", size: 3_000_000 })).toBeNull();
    expect(validarArchivoFoto({ type: "image/heic", size: 3_000_000 })).toBeNull();
  });

  it("rechaza lo que no es imagen", () => {
    expect(validarArchivoFoto({ type: "application/pdf", size: 1000 })).toBe("Elegí una imagen (JPG, PNG, WebP o HEIC).");
  });

  it("rechaza archivos de más de 10 MB", () => {
    expect(validarArchivoFoto({ type: "image/png", size: 10 * 1024 * 1024 + 1 })).toBe("La foto pesa más de 10 MB.");
  });
});

describe("rutaFoto", () => {
  it("guarda cada foto en la carpeta del producto, con nombre único", () => {
    const a = rutaFoto("5eed0000-0000-4000-8000-000000000201", "webp");
    const b = rutaFoto("5eed0000-0000-4000-8000-000000000201", "webp");
    expect(a).toMatch(/^productos\/5eed0000-0000-4000-8000-000000000201\/[0-9a-f-]{36}\.webp$/);
    expect(a).not.toBe(b);
  });
});
