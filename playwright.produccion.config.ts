import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

// Tests que necesitan la app armada como en producción (next build + next start),
// por ejemplo el caché de la carta, que no funciona en modo desarrollo.
loadEnvConfig(process.cwd());

const puerto = 3200;

export default defineConfig({
  testDir: "tests/e2e-produccion",
  timeout: 180_000,
  use: {
    baseURL: `http://localhost:${puerto}`,
    ...devices["Desktop Chrome"],
    viewport: { width: 390, height: 844 },
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    },
  },
  webServer: {
    command: `npm run build && npm run start -- --port ${puerto}`,
    url: `http://localhost:${puerto}`,
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
