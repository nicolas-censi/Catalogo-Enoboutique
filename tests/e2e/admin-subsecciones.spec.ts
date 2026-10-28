import { expect, test, type Page } from "@playwright/test";
import { clienteAdmin, limpiarDatos, limpiarUsuarios, prefijo } from "../db/ayudante";
import { entrarComo } from "./ayudante-admin";

// Spec 011, CA-1, CA-2, CA-4 y CA-5: subsecciones desde el panel (computadora).
test.use({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false });
test.describe.configure({ mode: "serial" });

const admin = clienteAdmin();
const n = (nombre: string) => `${prefijo} ${nombre}`;
const ids: Record<string, string> = {};

test.beforeAll(async () => {
  ids.cava = (await admin.from("secciones").insert({ nombre: n("Cava panel"), orden: 60000 }).select().single()).data!.id;
  await admin.from("productos").insert([
    { tipo: "vino", nombre: n("Gran Enemigo"), seccion_id: ids.cava, orden: 1 },
    { tipo: "vino", nombre: n("Cobos"), seccion_id: ids.cava },
  ]);
});

test.afterAll(async () => {
  await limpiarDatos();
  await limpiarUsuarios();
});

test.beforeEach(async ({ context }) => {
  await entrarComo(context, "vendedor");
});

const tabla = (page: Page) => page.getByRole("table", { name: "Subsecciones" });
const fila = (page: Page, nombre: string) => tabla(page).getByRole("row").filter({ hasText: nombre });
const hijas = async () =>
  ((await admin.from("secciones").select("nombre, visible").eq("seccion_padre_id", ids.cava).order("orden")).data ?? []).map((s) => [
    s.nombre.replace(`${prefijo} `, ""),
    s.visible,
  ]);
async function crear(page: Page, nombre: string) {
  await page.getByLabel("Nombre de la subsección nueva", { exact: true }).fill(n(nombre));
  await page.getByRole("button", { name: "Crear subsección" }).click();
}

test("CA-1 y CA-2: la primera subsección se lleva los productos de la sección, con aviso", async ({ page }) => {
  await page.goto("/admin/secciones");
  await page.getByRole("link", { name: n("Cava panel"), exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: n("Cava panel") })).toBeVisible();
  await expect(page.getByText("Todavía no tiene subsecciones.")).toBeVisible();
  await expect(page.getByRole("list", { name: "Destacados" })).toBeVisible();

  await crear(page, "Joyitas");
  await expect(page.getByRole("status").filter({ hasText: "pasaron" })).toHaveText(
    `Los 2 productos de ${n("Cava panel")} pasaron a ${n("Joyitas")}. Después podés moverlos.`,
  );
  await expect(fila(page, n("Joyitas"))).toContainText("2 productos");
  // Una sección con subsecciones no tiene destacados propios: los tiene cada subsección.
  await expect(page.getByRole("list", { name: "Destacados" })).toHaveCount(0);
});

test("CA-1: las siguientes quedan al final", async ({ page }) => {
  await page.goto(`/admin/secciones/${ids.cava}`);
  await crear(page, "Añadas");
  await expect(fila(page, n("Añadas"))).toContainText("0 productos");
  await crear(page, "Experiencias");
  await expect(fila(page, n("Experiencias"))).toBeVisible();
  expect(await hijas()).toEqual([
    ["Joyitas", true],
    ["Añadas", true],
    ["Experiencias", true],
  ]);
});

test("CA-5: ordena las subsecciones arrastrando con el teclado", async ({ page }) => {
  await page.goto(`/admin/secciones/${ids.cava}`);
  const manija = page.getByRole("button", { name: `Mover ${n("Experiencias")}` });
  await manija.focus();
  await page.keyboard.press("Space");
  await expect(manija).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(150); // dnd-kit escucha las flechas desde el próximo ciclo
  await page.keyboard.press("ArrowUp");
  await expect(page.getByText(`${n("Experiencias")}, posición 2 de 3.`, { exact: true })).toBeAttached();
  await page.keyboard.press("Space");
  await expect(page.getByRole("status").filter({ hasText: "Orden guardado" })).toBeVisible();
  await expect.poll(hijas).toEqual([
    ["Joyitas", true],
    ["Experiencias", true],
    ["Añadas", true],
  ]);
});

test("CA-5: oculta, renombra y borra una subsección vacía", async ({ page }) => {
  await page.goto(`/admin/secciones/${ids.cava}`);
  await fila(page, n("Añadas")).getByRole("switch").click();
  await expect(fila(page, n("Añadas")).getByRole("switch")).toHaveAttribute("aria-checked", "false");
  await expect.poll(hijas).toContainEqual(["Añadas", false]);

  await fila(page, n("Experiencias")).getByRole("button", { name: "Renombrar" }).click();
  await tabla(page).getByLabel("Nombre", { exact: true }).fill(n("Experiencias únicas"));
  await tabla(page).getByRole("button", { name: "Guardar" }).click();
  await expect(fila(page, n("Experiencias únicas"))).toHaveCount(1);

  await fila(page, n("Añadas")).getByRole("button", { name: "Borrar" }).click();
  await fila(page, n("Añadas")).getByRole("button", { name: "Sí, borrar" }).click();
  await expect(fila(page, n("Añadas"))).toHaveCount(0);
});

test("CA-4: cada subsección tiene sus destacados y vuelve a su sección", async ({ page }) => {
  await page.goto(`/admin/secciones/${ids.cava}`);
  await tabla(page).getByRole("link", { name: n("Joyitas"), exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: n("Joyitas") })).toBeVisible();
  // El destacado que tenía en la sección se conservó al pasar a la subsección.
  await expect(page.getByRole("list", { name: "Destacados" }).getByRole("heading")).toHaveText([n("Gran Enemigo")]);
  // Un solo nivel. (Next.js deja la página anterior oculta en memoria: solo lo visible.)
  await expect(page.getByLabel("Nombre de la subsección nueva").filter({ visible: true })).toHaveCount(0);
  await page.getByRole("link", { name: `Volver a ${n("Cava panel")}` }).click();
  await expect(page).toHaveURL(`/admin/secciones/${ids.cava}`);
});

test("CA-5: Secciones lista solo las de primer nivel y no deja borrar una con subsecciones", async ({ page }) => {
  await page.goto("/admin/secciones");
  const filaCava = page.getByRole("table", { name: "Secciones" }).getByRole("row").filter({ hasText: n("Cava panel") });
  await expect(filaCava).toContainText("2 subsecciones");
  await expect(page.getByRole("table", { name: "Secciones" }).getByText(n("Joyitas"))).toHaveCount(0);
  await filaCava.getByRole("button", { name: "Borrar" }).click();
  await expect(filaCava.getByRole("alert")).toHaveText("Tiene 2 subsecciones: no se puede borrar. Podés ocultarla.");
});
