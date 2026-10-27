import { expect, test } from "@playwright/test";
import { clienteAdmin, limpiarDatos, limpiarUsuarios, prefijo } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// CA-3: stock con un toque, desde la ficha del producto.
test.use({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false });

const admin = clienteAdmin();
const ids: Record<string, string> = {};

test.beforeAll(async () => {
  const { data: p } = await admin
    .from("productos")
    .insert({ tipo: "vino", nombre: `Escorihuela Gascón Malbec ${prefijo}` })
    .select()
    .single();
  ids.producto = p!.id;
  const { data: anadas } = await admin
    .from("anadas")
    .insert([
      { producto_id: p!.id, codigo_tango: `${prefijo}-1`, descripcion_tango: "ESCORIHUELA MAL 2021", tipo: "con_anio", anio: 2021, precio: 15000, en_stock: true },
      { producto_id: p!.id, codigo_tango: `${prefijo}-2`, descripcion_tango: "ESCORIHUELA MAL 2019", tipo: "con_anio", anio: 2019, precio: 19000, en_stock: false },
    ])
    .select();
  ids.a2021 = anadas!.find((a) => a.anio === 2021)!.id;
});

test.afterAll(async () => {
  await limpiarDatos();
  await limpiarUsuarios();
});

test("CA-3: el interruptor cambia el stock al toque y queda guardado", async ({ page, context }) => {
  await entrarComo(context, "vendedor");
  await page.goto(`/admin/productos/${ids.producto}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Escorihuela Gascón Malbec ${prefijo}`);

  const s2021 = page.getByRole("switch", { name: "Stock de 2021" });
  const s2019 = page.getByRole("switch", { name: "Stock de 2019" });
  await expect(s2021).toBeChecked();
  await expect(s2021).toHaveText("Disponible");
  await expect(s2019).not.toBeChecked();
  await expect(s2019).toHaveText("Sin stock");

  await s2021.click();
  await expect(s2021).not.toBeChecked();
  await expect(s2021).toHaveText("Sin stock");
  await s2019.click();
  await expect(s2019).toBeChecked();

  // Quedó guardado en la base (sin apretar otro botón).
  await expect
    .poll(async () => (await admin.from("anadas").select("en_stock").eq("id", ids.a2021).single()).data?.en_stock)
    .toBe(false);
  await page.reload();
  await expect(page.getByRole("switch", { name: "Stock de 2021" })).not.toBeChecked();
  await expect(page.getByRole("switch", { name: "Stock de 2019" })).toBeChecked();
});

test("un producto que no existe muestra que no se encontró", async ({ page, context }) => {
  await entrarComo(context, "vendedor");
  await page.goto("/admin/productos/00000000-0000-4000-8000-000000000000");
  await expect(page.getByText("No encontramos este producto.")).toBeVisible();
});
