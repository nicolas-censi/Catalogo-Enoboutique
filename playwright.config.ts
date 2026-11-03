import { defineConfig, devices } from "@playwright/test";

const puerto = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: `http://localhost:${puerto}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "celular",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        launchOptions: {
          // Permite usar un Chromium ya instalado (ej.: entornos sin descarga de navegadores).
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
        },
      },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${puerto}`,
    url: `http://localhost:${puerto}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Spec 007: en los tests, la IA de prueba (no gasta ni sale a internet).
    env: { IA_FALSA: "1", CRON_SECRET: "secreto-de-prueba-e2e" },
  },
});
