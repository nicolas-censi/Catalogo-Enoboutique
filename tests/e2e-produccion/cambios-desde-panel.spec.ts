import { expect, test } from "@playwright/test";
import { clienteAdmin, crearUsuarioConSesion, limpiarDatos, limpiarUsuarios, prefijo } from "../db/ayudante";

// CA-11: un cambio guardado desde el panel se ve en la carta al instante, sin esperar
// el minuto de caché.

const admin = clienteAdmin();
const ids: Record<string, string> = {};

test.beforeAll(async () => {
  const { data: s } = await admin.from("secciones").insert({ nombre: `${prefijo} Instante`, orden: 98 }).select().single();
  const { data: p } = await admin
    .from("productos")
    .insert({ tipo: "vino", nombre: `${prefijo} Vino al instante`, seccion_id: s!.id })
    .select()
    .single();
  ids.producto = p!.id;
  await admin.from("anadas").insert([
    { producto_id: p!.id, codigo_tango: `${prefijo}-1`, descripcion_tango: "PRUEBA 2022", tipo: "con_anio", anio: 2022, precio: 1000, en_stock: true },
    { producto_id: p!.id, codigo_tango: `${prefijo}-2`, descripcion_tango: "PRUEBA 2018", tipo: "con_anio", anio: 2018, precio: 2000, en_stock: true },
  ]);
});

test.afterAll(async () => {
  await limpiarDatos();
  await limpiarUsuarios();
});

test("CA-11: marcar sin stock desde el panel se ve en la carta al instante", async ({ page, context }) => {
  const carta = `/producto/${ids.producto}`;
  const anadas = page.getByRole("main").getByRole("listitem");

  // La carta queda en caché con las dos añadas.
  await page.goto(carta);
  await expect(anadas).toHaveCount(2);

  const { cookies } = await crearUsuarioConSesion("vendedor");
  await context.addCookies(cookies.map((c) => ({ ...c, domain: "localhost", path: "/", sameSite: "Lax" as const })));
  await page.goto(`/admin/productos/${ids.producto}`);
  const interruptor = page.getByRole("switch", { name: "Stock de 2018" });
  await interruptor.click();
  await expect(interruptor).not.toBeChecked();
  const momento = Date.now();
  await expect
    .poll(async () => (await admin.from("anadas").select("en_stock").eq("codigo_tango", `${prefijo}-2`).single()).data?.en_stock)
    .toBe(false);

  await page.goto(carta);
  await expect(anadas).toHaveCount(1);
  const segundos = (Date.now() - momento) / 1000;
  console.log(`Desde el panel, el cambio se vio en la carta a los ${segundos.toFixed(1)} segundos.`);
  expect(segundos).toBeLessThan(10);
});
