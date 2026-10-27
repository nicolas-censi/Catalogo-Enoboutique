import { expect, test, type Page } from "@playwright/test";
import { clienteAdmin, limpiarDatos, limpiarUsuarios, prefijo } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// CA-7: fotos desde la ficha del producto. La foto es opcional.
test.use({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false });
test.describe.configure({ mode: "serial" });

const admin = clienteAdmin();
const ids: Record<string, string> = {};
const nombre = `Achaval Ferrer Quimera ${prefijo}`;

const fotoEnBase = async () => (await admin.from("productos").select("foto_path").eq("id", ids.producto).single()).data!.foto_path;
const archivosDelProducto = async () =>
  ((await admin.storage.from("fotos").list(`productos/${ids.producto}`)).data ?? []).map((f) => f.name);

test.beforeAll(async () => {
  const seccion = await admin.from("secciones").insert({ nombre: `${prefijo} Fotos`, orden: 97 }).select().single();
  const p = await admin.from("productos").insert({ tipo: "vino", nombre, seccion_id: seccion.data!.id }).select().single();
  ids.producto = p.data!.id;
  await admin.from("anadas").insert({ producto_id: ids.producto, codigo_tango: `${prefijo}-q`, descripcion_tango: "QUIMERA 2020", tipo: "con_anio", anio: 2020, precio: 50000, en_stock: true });
});

test.afterAll(async () => {
  const archivos = await archivosDelProducto();
  if (archivos.length) await admin.storage.from("fotos").remove(archivos.map((a) => `productos/${ids.producto}/${a}`));
  await limpiarDatos();
  await limpiarUsuarios();
});

test.beforeEach(async ({ context }) => {
  await entrarComo(context, "vendedor");
});

const subir = (page: Page, archivo: string) => page.getByLabel("Subir foto", { exact: true }).setInputFiles(`tests/fixtures/${archivo}`);

test("CA-7: sin foto, el panel lo marca y la carta se ve bien", async ({ page }) => {
  await page.goto(`/admin?q=${prefijo}`);
  await expect(page.getByRole("row").filter({ hasText: nombre })).toContainText("Sin foto");
  await page.goto(`/admin/productos/${ids.producto}`);
  await expect(page.getByText("Este producto no tiene foto.")).toBeVisible();
  await page.goto(`/producto/${ids.producto}`);
  await expect(page.getByRole("main").getByRole("img")).toHaveCount(0);
});

test("CA-7: sube una foto grande, se achica y se ve en la carta", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.producto}`);
  await subir(page, "botella-grande.png");
  const foto = page.getByRole("img", { name: `Foto de ${nombre}` });
  await expect(foto).toBeVisible();
  await expect.poll(() => foto.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBeGreaterThan(0);

  await expect.poll(fotoEnBase).toMatch(new RegExp(`^productos/${ids.producto}/[0-9a-f-]{36}\\.webp$`));
  const url = admin.storage.from("fotos").getPublicUrl((await fotoEnBase())!).data.publicUrl;
  const medidas = await page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    return { ancho: img.naturalWidth, alto: img.naturalHeight };
  }, url);
  expect(medidas).toEqual({ ancho: 1200, alto: 1600 });

  await page.goto(`/producto/${ids.producto}`);
  const enCarta = page.getByRole("main").getByRole("img", { name: nombre });
  await expect(enCarta).toBeVisible();
  // Que la imagen haya cargado de verdad (no solo que esté el elemento).
  await expect.poll(() => enCarta.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBeGreaterThan(0);
  await page.goto(`/admin?q=${prefijo}`);
  await expect(page.getByRole("row").filter({ hasText: nombre })).not.toContainText("Sin foto");
});

test("CA-7: reemplazar la foto borra la anterior", async ({ page }) => {
  const anterior = await fotoEnBase();
  await page.goto(`/admin/productos/${ids.producto}`);
  await subir(page, "botella-chica.jpg");
  await expect.poll(fotoEnBase).not.toBe(anterior);
  await expect.poll(archivosDelProducto).toHaveLength(1);
});

test("CA-7: ofrece elegir archivos, no sacar la foto con la cámara", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.producto}`);
  const entrada = page.getByLabel("Subir foto", { exact: true });
  await expect(entrada).not.toHaveAttribute("capture");
  await expect(entrada).toHaveAttribute("accept", /image\/jpeg/);
  await expect(entrada).not.toHaveAttribute("accept", /image\/\*/);
});

test("CA-7: rechaza un archivo que no es imagen", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.producto}`);
  const antes = await fotoEnBase();
  await subir(page, "no-es-imagen.txt");
  await expect(page.getByRole("alert").filter({ hasText: "imagen" })).toHaveText("Elegí una imagen (JPG, PNG, WebP o HEIC).");
  expect(await fotoEnBase()).toBe(antes);
});

test("CA-7: quita la foto y la carta queda sin foto", async ({ page }) => {
  await page.goto(`/admin/productos/${ids.producto}`);
  await page.getByRole("button", { name: "Quitar foto" }).click();
  await expect(page.getByText("Este producto no tiene foto.")).toBeVisible();
  await expect.poll(fotoEnBase).toBeNull();
  await expect.poll(archivosDelProducto).toEqual([]);
  await page.goto(`/producto/${ids.producto}`);
  await expect(page.getByRole("main").getByRole("img")).toHaveCount(0);
});
