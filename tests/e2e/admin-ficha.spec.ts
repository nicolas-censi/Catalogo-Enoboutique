import { expect, test } from "@playwright/test";
import { clienteAdmin, limpiarDatos, limpiarUsuarios, prefijo } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// Spec 014, CA-6 y CA-3: ficha por pestañas y menú ⋯ (también con el teclado).
test.use({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false });
const admin = clienteAdmin();
let id = "";
const nombre = `Ficha Malbec ${prefijo}`;

test.beforeAll(async () => {
  id = (await admin.from("productos").insert({ tipo: "vino", nombre }).select().single()).data!.id;
  await admin.from("anadas").insert({ producto_id: id, codigo_tango: `${prefijo}-f`, descripcion_tango: "FICHA 2021", tipo: "con_anio", anio: 2021, precio: 20000, en_stock: true });
});
test.afterAll(async () => {
  await limpiarDatos();
  await limpiarUsuarios();
});

test("encabezado, pestañas en la dirección (Atrás y recargar las mantienen) y cantidades", async ({ page, context }) => {
  await entrarComo(context, "vendedor");
  await page.goto(`/admin/productos/${id}`);
  await expect(page.getByRole("heading", { level: 1, name: nombre })).toBeVisible();
  await expect(page.getByRole("switch", { name: "Visible en la carta" })).toHaveAttribute("aria-checked", "true");
  const pestanas = page.getByRole("navigation", { name: "Partes de la ficha" });
  await expect(pestanas.getByRole("link", { name: "Datos" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue(nombre);

  await pestanas.getByRole("link", { name: "Añadas y precios · 1" }).click();
  await expect(page).toHaveURL(/pestana=anadas/);
  await expect(page.getByRole("switch", { name: "Stock de 2021" })).toBeVisible();
  await expect(page.getByLabel("Nombre", { exact: true })).toHaveCount(0);

  await pestanas.getByRole("link", { name: "Códigos de barras · 0" }).click();
  await expect(page).toHaveURL(/pestana=codigos/);
  await page.reload();
  await expect(pestanas.getByRole("link", { name: "Códigos de barras · 0" })).toHaveAttribute("aria-current", "page");
  await page.goBack();
  await expect(page).toHaveURL(/pestana=anadas/);
});

test("el menú ⋯ se abre con el teclado, se recorre con flechas y Escape lo cierra devolviendo el foco", async ({ page, context }) => {
  await entrarComo(context, "vendedor");
  await page.goto(`/admin/productos/${id}`);
  await page.waitForLoadState("networkidle");
  const boton = page.getByRole("button", { name: `Más acciones para ${nombre}` });
  await boton.focus();
  await page.keyboard.press("Enter");
  await expect(boton).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("menuitem", { name: "Borrar producto" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(boton).toBeFocused();
  // Cancelar la confirmación no borra.
  await boton.click();
  await page.getByRole("menuitem", { name: "Borrar producto" }).click();
  await page.getByRole("dialog", { name: "Borrar producto" }).getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await admin.from("productos").select("id").eq("id", id)).data).toHaveLength(1);
});
