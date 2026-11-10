import QRCode from "qrcode";
import { describe, expect, it } from "vitest";
import { modulosQr, URL_CARTA_POR_DEFECTO, urlCarta, urlVisible } from "@/lib/qr";

// Spec 009, CA-4: el QR de la tarjeta de mesa.
describe("urlCarta", () => {
  it("por defecto, cava.lehonor.com; si no, la configurada sin barra final", () => {
    expect(urlCarta(undefined)).toBe(URL_CARTA_POR_DEFECTO);
    expect(urlCarta("")).toBe("https://cava.lehonor.com");
    expect(urlCarta("https://ejemplo.com/ ")).toBe("https://ejemplo.com");
    expect(urlVisible("https://cava.lehonor.com")).toBe("cava.lehonor.com");
  });
});

describe("modulosQr", () => {
  it("son los mismos módulos que genera la librería (se puede leer)", () => {
    const { tamano, oscuro } = modulosQr("https://cava.lehonor.com");
    const referencia = QRCode.create("https://cava.lehonor.com", { errorCorrectionLevel: "H" }).modules;
    expect(tamano).toBe(referencia.size);
    let iguales = true;
    for (let y = 0; y < tamano; y++) for (let x = 0; x < tamano; x++) if (oscuro(x, y) !== (referencia.data[y * tamano + x] === 1)) iguales = false;
    expect(iguales).toBe(true);
    // Patrón de posición arriba a la izquierda (7 × 7 con borde oscuro).
    expect(oscuro(0, 0) && oscuro(6, 0) && oscuro(0, 6) && !oscuro(1, 1)).toBe(true);
  });
});
