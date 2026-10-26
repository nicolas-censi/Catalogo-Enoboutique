import nextEnv from "@next/env";

// Carga .env.local igual que Next.js, para que los tests usen las mismas variables.
nextEnv.loadEnvConfig(process.cwd());
