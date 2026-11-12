import { expect, test } from "@playwright/test";

// Spec 018, CA-1: la carta enlaza el ícono de la marca (pestaña, Android e iPhone).
test("la carta enlaza favicon, icon y apple-touch-icon, y responden", async ({ page, request }) => {
  await page.goto("/");
  const enlaces = await page.locator('head link[rel="icon"], head link[rel="apple-touch-icon"]').evaluateAll((ls) =>
    ls.map((l) => ({ rel: l.getAttribute("rel"), href: (l as HTMLLinkElement).href })),
  );
  expect(enlaces.some((e) => e.rel === "icon" && /favicon\.ico/.test(e.href))).toBe(true);
  expect(enlaces.some((e) => e.rel === "icon" && /icon\.png/.test(e.href))).toBe(true);
  expect(enlaces.some((e) => e.rel === "apple-touch-icon" && /apple-icon\.png/.test(e.href))).toBe(true);
  for (const { href } of enlaces) {
    const r = await request.get(href);
    expect(r.status(), href).toBe(200);
    expect(r.headers()["content-type"]).toMatch(/image\//);
  }
});
