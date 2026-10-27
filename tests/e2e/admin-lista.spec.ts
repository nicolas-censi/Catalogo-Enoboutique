import { expect, test } from "@playwright/test";
import { clienteAdmin, limpiarDatos, limpiarUsuarios, prefijo } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// CA-2: lista y búsqueda de productos del panel (computadora).
test.use({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false });

const admin = clienteAdmin();
const ids: Record<string, string> = {};
let seccionId = "";

async function insertar(tabla: string, fila: Record<string, unknown>) {
  const { data, error } = await admin.from(tabla).insert(fila).select().single();
  if (error) throw error;
  return data as { id: string };
}

async function producto(clave: string, nombre: string, extra: Record<string, unknown>, anadas: Record<string, unknown>[]) {
  const p = await insertar("productos", { tipo: "vino", nombre: `${nombre} ${prefijo}`, ...extra });
  ids[clave] = p.id;
  for (const [i, a] of anadas.entries()) {
    await insertar("anadas", {
      producto_id: p.id,
      codigo_tango: `${prefijo}-${clave}-${i}`,
      descripcion_tango: nombre.toUpperCase(),
      tipo: "con_anio",
      anio: 2020 - i,
      precio: 10000,
      en_stock: true,
      ...a,
    });
  }
}

test.beforeAll(async () => {
  // Oculta: al panel no le importa y así no aparece en la carta de otros tests en paralelo.
  seccionId = (await insertar("secciones", { nombre: `${prefijo} Tintos`, orden: 90, visible: false })).id;
  await producto("disponible", "Altocedro Malbec", { seccion_id: seccionId }, [{}, {}]);
  await producto("oculto", "Bramare Cabernet", { seccion_id: seccionId, visible: false }, [{}]);
  await producto("agotado", "Catena Alta Chardonnay", {}, [{ en_stock: false }, { en_stock: false }]);
  await producto("revisar", "Durigutti Bonarda", { seccion_id: seccionId }, [{ tipo: "sin_especificar", anio: null }, {}]);
});

test.afterAll(async () => {
  await limpiarDatos();
  await limpiarUsuarios();
});

test.beforeEach(async ({ context }) => {
  await entrarComo(context, "vendedor");
});

const filas = (page: import("@playwright/test").Page) => page.getByRole("table").getByRole("row").filter({ hasText: prefijo });
const nombres = async (page: import("@playwright/test").Page) =>
  (await filas(page).getByRole("link").allTextContents()).map((t) => t.replace(` ${prefijo}`, "")).sort();

test("CA-2: muestra todos los productos con su estado, también ocultos y sin stock", async ({ page }) => {
  await page.goto(`/admin?q=${prefijo}`);
  await expect(filas(page)).toHaveCount(4);
  await expect(filas(page).filter({ hasText: "Bramare" })).toContainText("Oculto");
  await expect(filas(page).filter({ hasText: "Catena Alta" })).toContainText("Sin stock");
  await expect(filas(page).filter({ hasText: "Catena Alta" })).toContainText("Sin sección");
  await expect(filas(page).filter({ hasText: "Durigutti" })).toContainText("A revisar");
  await expect(filas(page).filter({ hasText: "Altocedro" })).toContainText(`${prefijo} Tintos`);
  await expect(filas(page).filter({ hasText: "Altocedro" }).getByRole("link")).toHaveAttribute(
    "href",
    `/admin/productos/${ids.disponible}`,
  );
});

test("CA-2: busca con errores de tipeo y por código de Tango", async ({ page }) => {
  await page.goto("/admin");
  const buscador = page.getByRole("searchbox", { name: "Buscar productos" });
  await expect(buscador).toBeFocused();
  await buscador.fill(`altocedr ${prefijo}`);
  await buscador.press("Enter");
  await expect(filas(page).first()).toContainText("Altocedro");

  await buscador.fill(`${prefijo}-oculto-0`);
  await buscador.press("Enter");
  await expect(filas(page)).toHaveCount(1);
  await expect(filas(page)).toContainText("Bramare");
});

test.describe("CA-2: filtros en la dirección", () => {
  for (const [estado, esperado] of [
    ["ocultos", ["Bramare Cabernet"]],
    ["sin-stock", ["Catena Alta Chardonnay"]],
    ["a-revisar", ["Durigutti Bonarda"]],
  ] as const) {
    test(`filtra por ${estado}`, async ({ page }) => {
      await page.goto(`/admin?q=${prefijo}&estado=${estado}`);
      await expect(filas(page)).toHaveCount(esperado.length);
      expect(await nombres(page)).toEqual(esperado);
    });
  }

  test("filtra por sección desde el formulario", async ({ page }) => {
    await page.goto(`/admin?q=${prefijo}`);
    await page.getByLabel("Sección").selectOption({ label: `${prefijo} Tintos` });
    await page.getByRole("button", { name: "Filtrar" }).click();
    await expect(page).toHaveURL(new RegExp(`seccion=${seccionId}`));
    await expect(filas(page)).toHaveCount(3);
    expect(await nombres(page)).toEqual(["Altocedro Malbec", "Bramare Cabernet", "Durigutti Bonarda"]);
  });
});

test("sin resultados lo dice", async ({ page }) => {
  await page.goto("/admin?q=zzzzqqqq");
  await expect(page.getByText("No hay productos que coincidan.")).toBeVisible();
});
