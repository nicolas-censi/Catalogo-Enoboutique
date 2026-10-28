import { describe, expect, it } from "vitest";
import { codigoValido, expandirUpcE, mensajeErrorCamara, variantesCodigo } from "@/lib/escaneo";

describe("codigoValido (CA-2)", () => {
  it.each([
    ["7798074860141", "ean_13"],
    ["4006381333931", "ean_13"],
    ["036000291452", "upc_a"],
    ["96385074", "ean_8"],
    ["04252614", "upc_e"],
  ])("acepta %s (%s) con dígito verificador correcto", (codigo, formato) => {
    expect(codigoValido(codigo, formato)).toBe(true);
  });

  it.each([
    ["7798074860142", "ean_13"],
    ["036000291453", "upc_a"],
    ["96385075", "ean_8"],
    ["04252615", "upc_e"],
    ["77980748601", "ean_13"],
    ["779807486014A", "ean_13"],
  ])("rechaza %s (%s): lectura parcial o errónea", (codigo, formato) => {
    expect(codigoValido(codigo, formato)).toBe(false);
  });

  it("rechaza formatos que no son de botellas (por ejemplo, un QR)", () => {
    expect(codigoValido("https://lehonor.com", "qr_code")).toBe(false);
  });
});

describe("expandirUpcE", () => {
  it("expande un UPC-E a su UPC-A equivalente", () => {
    expect(expandirUpcE("04252614")).toBe("042100005264");
  });
});

describe("variantesCodigo", () => {
  it("un UPC-A de 12 dígitos también se busca como EAN-13 con 0 adelante", () => {
    expect(variantesCodigo("036000291452")).toEqual(["036000291452", "0036000291452"]);
  });

  it("un EAN-13 que empieza con 0 también se busca sin ese 0 (como UPC-A)", () => {
    expect(variantesCodigo("0036000291452")).toEqual(["0036000291452", "036000291452"]);
  });

  it("un EAN-13 común se busca tal cual", () => {
    expect(variantesCodigo("7798074860141")).toEqual(["7798074860141"]);
  });
});

describe("mensajeErrorCamara (CA-4)", () => {
  it("permiso denegado", () => {
    expect(mensajeErrorCamara("NotAllowedError")).toMatch(/permiso para usar la cámara/);
  });
  it("sin cámara", () => {
    expect(mensajeErrorCamara("NotFoundError")).toMatch(/No encontramos una cámara/);
  });
  it("cámara ocupada por otra app", () => {
    expect(mensajeErrorCamara("NotReadableError")).toMatch(/otra aplicación/);
  });
  it("navegador sin acceso a la cámara", () => {
    expect(mensajeErrorCamara("SinSoporte")).toMatch(/no permite usar la cámara/);
  });
});
