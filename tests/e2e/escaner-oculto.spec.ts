import { expect, test } from "@playwright/test";
import { camaraSimulada } from "./video-codigo";

// CA-3 (spec 003): el código de un producto oculto (Zuccardi Q Malbec Magnum, en la
// sección oculta "Próximamente" del seed) da el mismo mensaje que uno inexistente.
test.use(camaraSimulada("7791728001709"));

test("CA-3: no revela productos ocultos", async ({ page }) => {
  await page.goto("/escanear");
  await expect(page.getByRole("status")).toHaveText("No encontramos ese código en la carta.", { timeout: 20_000 });
  await expect(page.getByText("Magnum")).toHaveCount(0);
});
