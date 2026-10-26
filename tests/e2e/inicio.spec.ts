import { expect, test } from "@playwright/test";

test("la página de inicio carga en el celular sin errores en la consola", async ({
  page,
}) => {
  const errores: string[] = [];
  page.on("console", (mensaje) => {
    if (mensaje.type() === "error") errores.push(mensaje.text());
  });
  page.on("pageerror", (error) => errores.push(error.message));

  const respuesta = await page.goto("/");

  expect(respuesta?.status()).toBe(200);
  expect(page.viewportSize()).toEqual({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(errores).toEqual([]);
});
