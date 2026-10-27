import { expect, test } from "@playwright/test";
import { clienteAdmin, limpiarDatos, prefijo } from "../db/ayudante";

// CA-10: un cambio del personal (precio, stock) se ve en la carta en hasta 1 minuto.

const admin = clienteAdmin();
const ids: Record<string, string> = {};

async function insertar(tabla: string, fila: Record<string, unknown>) {
  const { data, error } = await admin.from(tabla).insert(fila).select().single();
  if (error) throw error;
  return data as { id: string };
}

test.beforeAll(async () => {
  const seccion = await insertar("secciones", { nombre: `${prefijo} Cache`, orden: 99 });
  const producto = await insertar("productos", {
    tipo: "vino",
    nombre: `${prefijo} Vino de prueba`,
    seccion_id: seccion.id,
  });
  ids.producto = producto.id;
  const base = { producto_id: producto.id, descripcion_tango: "PRUEBA", tipo: "con_anio", en_stock: true };
  ids.anada2021 = (await insertar("anadas", { ...base, codigo_tango: `${prefijo}-1`, anio: 2021, precio: 1000 })).id;
  ids.anada2019 = (await insertar("anadas", { ...base, codigo_tango: `${prefijo}-2`, anio: 2019, precio: 3000 })).id;
});

test.afterAll(limpiarDatos);

test("CA-10: un cambio de precio y de stock se ve en la carta en hasta 1 minuto", async ({ page }) => {
  const direccion = `/producto/${ids.producto}`;
  const lista = page.getByRole("main").getByRole("listitem");

  await page.goto(direccion);
  await expect(lista).toHaveText([/2021\s*\$\s*1\.000/, /2019\s*\$\s*3\.000/]);

  // El personal sube el precio de la 2021 y marca la 2019 sin stock.
  await admin.from("anadas").update({ precio: 2000 }).eq("id", ids.anada2021);
  await admin.from("anadas").update({ en_stock: false }).eq("id", ids.anada2019);
  const momentoDelCambio = Date.now();

  // Recién hecho el cambio, la carta todavía puede mostrar lo anterior (caché).
  // Se recarga cada 5 segundos hasta ver el cambio; tiene que llegar en ≤ 1 minuto
  // (más un margen para que se regenere la página).
  await expect(async () => {
    await page.goto(direccion);
    await expect(lista).toHaveText([/2021\s*\$\s*2\.000/], { timeout: 1000 });
  }).toPass({ intervals: [5000], timeout: 80_000 });

  const segundos = (Date.now() - momentoDelCambio) / 1000;
  console.log(`El cambio se vio a los ${segundos.toFixed(0)} segundos.`);
  expect(segundos).toBeLessThanOrEqual(80);
});
