import { expect, test } from "@playwright/test";
import { clienteAdmin, limpiarDatos, limpiarUsuarios, prefijo } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// CA-4: alta y edición de productos (computadora).
test.use({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false });

const admin = clienteAdmin();
const ids: Record<string, string> = {};

test.beforeAll(async () => {
  ids.seccion = (await admin.from("secciones").insert({ nombre: `${prefijo} Tintos`, orden: 91, visible: false }).select().single()).data!.id;
  ids.bodega = (await admin.from("bodegas").insert({ nombre: `Catena Zapata ${prefijo}` }).select().single()).data!.id;
  const vino = await admin.from("productos").insert({ tipo: "vino", nombre: `Nicasia Malbec ${prefijo}`, varietal: "Malbec" }).select().single();
  ids.vino = vino.data!.id;
  await admin.from("anadas").insert([
    { producto_id: ids.vino, codigo_tango: `${prefijo}-n1`, descripcion_tango: "NICASIA MAL 2021", tipo: "con_anio", anio: 2021 },
    { producto_id: ids.vino, codigo_tango: `${prefijo}-n2`, descripcion_tango: "NICASIA MAL 2020", tipo: "con_anio", anio: 2020 },
  ]);
});

test.afterAll(async () => {
  await limpiarDatos();
  await limpiarUsuarios();
});

test.beforeEach(async ({ context }) => {
  await entrarComo(context, "vendedor");
});

test("CA-4: da de alta un vino con una bodega nueva", async ({ page }) => {
  await page.goto("/admin");
  await page.getByRole("link", { name: "Nuevo producto" }).click();
  await expect(page).toHaveURL(/\/admin\/productos\/nuevo$/);

  await page.getByLabel("Tipo").selectOption("vino");
  await page.getByLabel("Nombre").fill(`Iscay Syrah ${prefijo}`);
  await page.getByLabel("Bodega").fill(`Trapiche ${prefijo}`);
  await page.getByLabel("Varietal").fill("Syrah - Malbec");
  // getByRole ignora la página anterior que Next.js 16 deja oculta (tiene otro "Sección").
  await page.getByRole("combobox", { name: "Sección" }).selectOption({ label: `${prefijo} Tintos` });
  await page.getByLabel("Descripción").fill("Blend de Valle de Uco.");
  await page.getByRole("button", { name: "Guardar" }).click();

  await expect(page).toHaveURL(/\/admin\/productos\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Iscay Syrah ${prefijo}`);

  const { data } = await admin
    .from("productos")
    .select("tipo, varietal, descripcion, visible, seccion_id, bodegas(nombre)")
    .eq("nombre", `Iscay Syrah ${prefijo}`)
    .single();
  expect(data).toEqual({
    tipo: "vino",
    varietal: "Syrah - Malbec",
    descripcion: "Blend de Valle de Uco.",
    visible: true,
    seccion_id: ids.seccion,
    bodegas: { nombre: `Trapiche ${prefijo}` },
  });
});

test("CA-4: sin tipo ni nombre muestra los errores junto a los campos y no guarda", async ({ page }) => {
  await page.goto("/admin/productos/nuevo");
  await page.getByLabel("Bodega").fill(`No debería crearse ${prefijo}`);
  await page.getByRole("button", { name: "Guardar" }).click();

  await expect(page.getByLabel("Tipo")).toHaveAccessibleDescription("Elegí el tipo de producto.");
  await expect(page.getByLabel("Nombre")).toHaveAccessibleDescription("Escribí el nombre.");
  await expect(page.getByLabel("Nombre")).toHaveAttribute("aria-invalid", "true");
  await expect(page).toHaveURL(/\/admin\/productos\/nuevo$/);
  // Lo que se escribió no se pierde.
  await expect(page.getByLabel("Bodega")).toHaveValue(`No debería crearse ${prefijo}`);
  const { data } = await admin.from("bodegas").select("id").eq("nombre", `No debería crearse ${prefijo}`);
  expect(data).toEqual([]);
});

test("CA-4 y CA-8: edita un producto, elige una bodega existente y lo oculta", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.vino}`);
  await expect(page.getByLabel("Nombre")).toHaveValue(`Nicasia Malbec ${prefijo}`);
  await page.getByLabel("Nombre").fill(`Nicasia Red Blend ${prefijo}`);
  await page.getByLabel("Bodega").fill(`Catena Zapata ${prefijo}`);
  await page.getByLabel("Visible en la carta").uncheck();
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("status")).toHaveText("Cambios guardados.");

  const { data } = await admin.from("productos").select("nombre, bodega_id, visible").eq("id", ids.vino).single();
  expect(data).toEqual({ nombre: `Nicasia Red Blend ${prefijo}`, bodega_id: ids.bodega, visible: false });
  const bodegas = await admin.from("bodegas").select("id").like("nombre", `Catena Zapata ${prefijo}`);
  expect(bodegas.data).toHaveLength(1);

  await page.reload();
  await expect(page.getByLabel("Nombre")).toHaveValue(`Nicasia Red Blend ${prefijo}`);
  await expect(page.getByLabel("Visible en la carta")).not.toBeChecked();
});

test("CA-4: un cambio que choca con las reglas muestra un mensaje claro", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.vino}`);
  await page.getByLabel("Tipo").selectOption("aceite");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "presentación" })).toHaveText(
    "Un aceite tiene una sola presentación, sin año.",
  );
  const { data } = await admin.from("productos").select("tipo").eq("id", ids.vino).single();
  expect(data!.tipo).toBe("vino");
});
