import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/db/**/*.test.ts"],
    setupFiles: ["tests/setup-env.ts"],
    // Los tests de base de datos comparten el proyecto de desarrollo: de a un archivo por vez.
    fileParallelism: false,
    testTimeout: 30_000,
    passWithNoTests: true,
  },
});
