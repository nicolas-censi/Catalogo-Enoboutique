import { expect, test } from "@playwright/test";
import { limpiarUsuarios } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";
import { desborde, erroresGraves } from "./chequeos-celular";

// Spec 009, CA-4: tarjeta de mesa con el QR, imprimible, solo para el encargado.
test.afterAll(limpiarUsuarios);

test("un vendedor no tiene acceso a la tarjeta QR", async ({ page, context }) => {
  await entrarComo(context, "vendedor");
  await page.goto("/admin/qr");
  await expect(page.getByText("No tenés acceso al panel.")).toBeVisible();
});

test.describe("en la computadora", () => {
  test.use({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false });

  test("desde Ajustes: la tarjeta con el logo, el QR de cava.lehonor.com y el texto; al imprimir, 10 × 15 cm sin el panel", async ({ page, context }) => {
    await entrarComo(context, "encargado");
    await page.goto("/admin/ajustes");
    await page.getByRole("main").getByRole("link", { name: /^Tarjeta QR/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Tarjeta QR" })).toBeVisible();
    const tarjeta = page.getByRole("article", { name: "Tarjeta de mesa" });
    await expect(tarjeta.getByRole("img", { name: "Código QR que abre cava.lehonor.com" })).toBeVisible();
    await expect(tarjeta.getByRole("img", { name: "Lehonor Enoboutique" })).toBeVisible();
    await expect(tarjeta).toContainText("Escaneá para ver la carta");
    await expect(tarjeta).toContainText("cava.lehonor.com");
    await expect(page.getByRole("button", { name: "Imprimir" })).toBeVisible();
    expect(await erroresGraves(page)).toEqual([]);

    // Vista de impresión: la tarjeta ocupa 10 × 15 cm y el resto del panel no se ve.
    await page.emulateMedia({ media: "print" });
    const caja = (await tarjeta.boundingBox())!;
    const mm = 96 / 25.4;
    expect(Math.round(caja.width / mm)).toBe(100);
    expect(Math.round(caja.height / mm)).toBe(150);
    await expect(page.getByRole("navigation", { name: "Panel" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Imprimir" })).not.toBeVisible();
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    expect(pdf.byteLength).toBeGreaterThan(1000);
  });
});

test("spec 016, CA-4: colores de la carta, QR negro sobre blanco (no invertido) y el dorado solo como detalle", async ({ page, context }) => {
  await entrarComo(context, "encargado");
  await page.goto("/admin/qr");
  const tarjeta = page.getByRole("article", { name: "Tarjeta de mesa" });
  await expect(tarjeta).toHaveCSS("background-color", "rgb(246, 242, 233)");
  await expect(tarjeta).toHaveCSS("color", "rgb(27, 26, 23)");
  const qr = tarjeta.getByRole("img", { name: /Código QR/ });
  await expect(qr.locator("path")).toHaveCSS("fill", "rgb(27, 26, 23)");
  // Lo que queda detrás del QR es blanco.
  await expect(qr.locator("xpath=..")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(tarjeta.getByText("Escaneá para ver la carta")).toHaveCSS("color", "rgb(27, 26, 23)");
  await expect(tarjeta.locator("[data-detalle-dorado]")).toHaveCSS("background-color", "rgb(177, 151, 80)");
});

test("en el celular: sin scroll horizontal de la página", async ({ page, context }) => {
  await entrarComo(context, "encargado");
  await page.goto("/admin/qr");
  await expect(page.getByRole("article", { name: "Tarjeta de mesa" })).toBeVisible();
  expect(await desborde(page)).toBeLessThanOrEqual(0);
});
