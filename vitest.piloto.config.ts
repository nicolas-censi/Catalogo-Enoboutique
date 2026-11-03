import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Spec 007, T3: prueba real con Gemini sobre productos de la base (gasta; se corre a mano
// con `npm run ia:piloto`). No escribe en la base.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  test: {
    include: ["tests/piloto/**/*.piloto.ts"],
    setupFiles: ["tests/setup-env.ts"],
    testTimeout: 60 * 60_000,
  },
});
