import { defineConfig } from "@playwright/test";

// Capturas para los manuales (docs/manual). Usa la base de DESARROLLO y la IA de prueba.
// Uso: npx playwright test --config docs/manual/playwright.config.ts
const puerto = 3100;

export default defineConfig({
  testDir: ".",
  testMatch: /capturas\.spec\.ts$/,
  timeout: 1_500_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: "line",
  use: {
    baseURL: `http://localhost:${puerto}`,
    locale: "es-AR",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    timezoneId: "America/Argentina/Buenos_Aires",
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined },
  },
  webServer: {
    command: `npm run dev -- --port ${puerto}`,
    url: `http://localhost:${puerto}`,
    reuseExistingServer: true,
    timeout: 120_000,
    env: { IA_FALSA: "1", CRON_SECRET: "secreto-manual" },
  },
});
