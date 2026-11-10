import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Spec 009, CA-5 y CA-6: la consulta diaria (para que Supabase no pause el proyecto) y el
// cron de la cola de la IA.
test("/api/salud responde que la base anda", async ({ request }) => {
  const r = await request.get("/api/salud");
  expect(r.status()).toBe(200);
  expect(await r.json()).toEqual({ ok: true });
});

test("vercel.json programa la salud y la cola de la IA una vez por día (plan Hobby)", () => {
  const { crons } = JSON.parse(readFileSync("vercel.json", "utf8")) as { crons: { path: string; schedule: string }[] };
  expect(crons.map((c) => c.path).sort()).toEqual(["/api/salud", "/api/sugerencias/procesar"]);
  // Una vez por día: minuto y hora fijos.
  for (const c of crons) expect(c.schedule).toMatch(/^\d+ \d+ \* \* \*$/);
});
