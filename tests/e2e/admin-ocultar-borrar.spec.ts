import { expect, test } from "@playwright/test";
import { clienteAdmin, limpiarDatos, limpiarUsuarios, prefijo } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// CA-8: ocultar, mostrar y borrar productos.
test.use({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false });

const admin = clienteAdmin();
const ids: Record<string, string> = {};

async function crearVino(nombre: string) {
  const p = await admin.from("productos").insert({ tipo: "vino", nombre, seccion_id: ids.seccion }).select().single();
  await admin.from("anadas").insert([
    { producto_id: p.data!.id, codigo_tango: `${prefijo}-${nombre.length}-1`, descripcion_tango: "X 2021", tipo: "con_anio", anio: 2021, precio: 10000, en_stock: true },
    { producto_id: p.data!.id, codigo_tango: `${prefijo}-${nombre.length}-2`, descripcion_tango: "X 2020", tipo: "con_anio", anio: 2020, precio: 11000, en_stock: true },
  ]);
  await admin.from("codigos_barras").insert({ codigo: `9998${String(Date.now()).slice(-9)}`, producto_id: p.data!.id });
  return p.data!.id;
}

test.beforeAll(async () => {
  ids.seccion = (await admin.from("secciones").insert({ nombre: `${prefijo} Visible`, orden: 96 }).select().single()).data!.id;
  ids.ocultar = await crearVino(`Luigi Bosca Malbec ${prefijo}`);
  ids.borrar = await crearVino(`Lagarde Primeras Viñas ${prefijo}`);
});

test.afterAll(async () => {
  await limpiarDatos();
  await limpiarUsuarios();
});

test.beforeEach(async ({ context }) => {
  await entrarComo(context, "vendedor");
});

test("CA-8: ocultar saca el producto de la carta pero queda en el panel, y se puede volver a mostrar", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.ocultar}`);
  await page.waitForLoadState("networkidle");
  // Spec 014, CA-6: interruptor arriba de la ficha; se guarda al tocarlo.
  const visible = page.getByRole("switch", { name: "Visible en la carta" });
  await visible.click();
  await expect(visible).toHaveAttribute("aria-checked", "false");
  await expect.poll(async () => (await admin.from("productos").select("visible").eq("id", ids.ocultar).single()).data!.visible).toBe(false);

  await page.goto(`/producto/${ids.ocultar}`);
  await expect(page.getByText("No encontramos este producto")).toBeVisible();
  await page.goto(`/admin?q=${prefijo}`);
  await expect(page.getByRole("list", { name: "Productos" }).getByRole("listitem").filter({ hasText: "Luigi Bosca" })).toContainText("Oculto");

  await page.goto(`/admin/productos/${ids.ocultar}`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("switch", { name: "Visible en la carta" }).click();
  await expect.poll(async () => (await admin.from("productos").select("visible").eq("id", ids.ocultar).single()).data!.visible).toBe(true);
  await page.goto(`/producto/${ids.ocultar}`);
  await expect(page.getByRole("heading", { level: 1, name: `Luigi Bosca Malbec ${prefijo}` })).toBeVisible();
});

test("CA-8: borrar pide confirmación y se puede cancelar", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.borrar}`);
  await page.waitForLoadState("networkidle");
  // Spec 014, CA-3: borrar está en el menú ⋯ y pide confirmación.
  await page.getByRole("button", { name: /^Más acciones para / }).click();
  await page.getByRole("menuitem", { name: "Borrar producto" }).click();
  const dialogo = page.getByRole("dialog");
  await expect(dialogo).toContainText(`¿Borrar Lagarde Primeras Viñas ${prefijo} y sus 2 añadas? No se puede deshacer.`);
  await dialogo.getByRole("button", { name: "Cancelar" }).click();
  await expect(dialogo).toBeHidden();
  const sigue = await admin.from("productos").select("id").eq("id", ids.borrar);
  expect(sigue.data).toHaveLength(1);
});

test("CA-8: borrar elimina el producto con sus añadas y códigos, y vuelve a la lista", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.borrar}`);
  await page.waitForLoadState("networkidle");
  // Spec 014, CA-3: borrar está en el menú ⋯ y pide confirmación.
  await page.getByRole("button", { name: /^Más acciones para / }).click();
  await page.getByRole("menuitem", { name: "Borrar producto" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Sí, borrar" }).click();

  await expect(page).toHaveURL(/\/admin(\?.*)?$/);
  await expect(page.getByRole("status")).toHaveText(`Se borró Lagarde Primeras Viñas ${prefijo}.`);
  for (const tabla of ["productos", "anadas", "codigos_barras"] as const) {
    const columna = tabla === "productos" ? "id" : "producto_id";
    const { data } = await admin.from(tabla).select(columna).eq(columna, ids.borrar);
    expect(data, tabla).toEqual([]);
  }
  await page.goto(`/producto/${ids.borrar}`);
  await expect(page.getByText("No encontramos este producto")).toBeVisible();
});
