import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { achicarAWebp, descargarSeguro, esIpPrivada, extraerImagen, obtenerFoto } from "@/lib/ia/foto";
import { FOTO_FALSA } from "@/lib/ia/falso";

// Spec 007, T4 (CA-4, CA-6): de la página oficial a una foto WebP, sin abrir la puerta a
// direcciones internas (SSRF).

describe("extraerImagen", () => {
  const base = "https://www.rutini.com/vinos/malbec";
  it("prefiere og:image y resuelve direcciones relativas", () => {
    const html = `<html><head><meta property="og:image" content="/img/malbec.png"></head><body><img src="logo.png"></body></html>`;
    expect(extraerImagen(html, base)).toBe("https://www.rutini.com/img/malbec.png");
  });
  it("después twitter:image; si no, la primera imagen del contenido que no sea logo ni ícono", () => {
    expect(extraerImagen(`<meta name="twitter:image" content="https://cdn.rutini.com/a.jpg">`, base)).toBe("https://cdn.rutini.com/a.jpg");
    const html = `<img src="/logo.svg"><img src="/icons/x.png"><img data-src="/botellas/malbec.webp" src="data:image/gif;base64,R0">`;
    expect(extraerImagen(html, base)).toBe("https://www.rutini.com/botellas/malbec.webp");
  });
  it("devuelve null si no hay imagen https", () => {
    expect(extraerImagen(`<meta property="og:image" content="http://sitio.com/a.png">`, base)).toBeNull();
    expect(extraerImagen(`<p>sin imágenes</p>`, base)).toBeNull();
  });
});

describe("esIpPrivada", () => {
  it("reconoce direcciones privadas, locales y reservadas (IPv4 e IPv6)", () => {
    for (const ip of ["10.0.0.1", "172.16.5.4", "192.168.1.1", "127.0.0.1", "169.254.169.254", "0.0.0.0", "100.64.0.1", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:7f00:1", "::"]) {
      expect(esIpPrivada(ip), ip).toBe(true);
    }
  });
  it("deja pasar direcciones públicas", () => {
    for (const ip of ["8.8.8.8", "172.32.0.1", "200.45.10.3", "2800:3f0:4002:80b::2003"]) expect(esIpPrivada(ip), ip).toBe(false);
  });
});

function fetchFalso(rutas: Record<string, () => Response>) {
  const pedidas: string[] = [];
  const f = (async (url: string | URL) => {
    pedidas.push(String(url));
    const r = rutas[String(url)];
    if (!r) throw new Error(`sin respuesta para ${url}`);
    return r();
  }) as typeof fetch;
  return { f, pedidas };
}
const resolverPublico = async () => ["93.184.216.34"];
const png = async () => sharp({ create: { width: 40, height: 60, channels: 3, background: "#B19750" } }).png().toBuffer();

describe("descargarSeguro", () => {
  it("rechaza lo que no es https y los nombres que resuelven a direcciones privadas", async () => {
    await expect(descargarSeguro("http://sitio.com/a.png", { resolver: resolverPublico })).rejects.toThrow(/https/);
    await expect(descargarSeguro("https://localhost/a.png", { resolver: resolverPublico })).rejects.toThrow(/privada/);
    await expect(descargarSeguro("https://interno.ejemplo/a.png", { resolver: async () => ["10.1.2.3"] })).rejects.toThrow(/privada/);
  });

  it("sigue redirecciones revisando cada salto (y corta a la tercera)", async () => {
    const { f } = fetchFalso({
      "https://a.com/x": () => new Response(null, { status: 302, headers: { location: "https://b.com/y" } }),
      "https://b.com/y": () => new Response("hola", { headers: { "content-type": "text/html" } }),
    });
    const r = await descargarSeguro("https://a.com/x", { fetch: f, resolver: resolverPublico });
    expect(r.url).toBe("https://b.com/y");
    const malo = fetchFalso({ "https://a.com/x": () => new Response(null, { status: 302, headers: { location: "https://127.0.0.1/" } }) });
    await expect(descargarSeguro("https://a.com/x", { fetch: malo.f, resolver: async (h) => (h === "127.0.0.1" ? ["127.0.0.1"] : ["93.184.216.34"]) })).rejects.toThrow(/privada/);
    const bucle = fetchFalso({ "https://a.com/x": () => new Response(null, { status: 302, headers: { location: "https://a.com/x" } }) });
    await expect(descargarSeguro("https://a.com/x", { fetch: bucle.f, resolver: resolverPublico })).rejects.toThrow(/redirecciones/);
  });

  it("corta si pasa el tamaño máximo o no es del tipo esperado", async () => {
    const grande = fetchFalso({ "https://a.com/g": () => new Response(new Uint8Array(2048), { headers: { "content-type": "image/png" } }) });
    await expect(descargarSeguro("https://a.com/g", { fetch: grande.f, resolver: resolverPublico, maximoBytes: 1024 })).rejects.toThrow(/pesado/);
    const html = fetchFalso({ "https://a.com/h": () => new Response("<p>", { headers: { "content-type": "text/html" } }) });
    await expect(descargarSeguro("https://a.com/h", { fetch: html.f, resolver: resolverPublico, tipo: /^image\// })).rejects.toThrow(/tipo/);
  });
});

describe("achicarAWebp", () => {
  it("pasa a WebP y achica a 1600 px de lado mayor sin agrandar", async () => {
    const enorme = await sharp({ create: { width: 3200, height: 2000, channels: 3, background: "#000" } }).jpeg().toBuffer();
    const meta = await sharp(await achicarAWebp(enorme)).metadata();
    expect(meta).toMatchObject({ format: "webp", width: 1600, height: 1000 });
    expect((await sharp(await achicarAWebp(await png())).metadata()).width).toBe(40);
  });
  it("rechaza lo que no es una imagen", async () => {
    await expect(achicarAWebp(Buffer.from("<svg onload=alert(1)>"))).rejects.toThrow();
  });
});

describe("obtenerFoto", () => {
  it("usa la imagen que vio la IA; si no hay, la saca de la página oficial", async () => {
    const imagen = await png();
    const { f, pedidas } = fetchFalso({
      "https://bodega.com/malbec": () => new Response(`<meta property="og:image" content="/m.png">`, { headers: { "content-type": "text/html" } }),
      "https://bodega.com/m.png": () => new Response(imagen, { headers: { "content-type": "image/png" } }),
    });
    const r = await obtenerFoto({ fotoUrl: null, paginaFoto: "https://bodega.com/malbec" }, { fetch: f, resolver: resolverPublico });
    expect(r).toMatchObject({ ok: true, urlOrigen: "https://bodega.com/m.png", sitio: "bodega.com" });
    expect(pedidas).toEqual(["https://bodega.com/malbec", "https://bodega.com/m.png"]);
  });

  it("si la imagen de la IA falla, prueba con la página", async () => {
    const imagen = await png();
    const { f } = fetchFalso({
      "https://bodega.com/rota.png": () => new Response("no", { status: 404 }),
      "https://bodega.com/malbec": () => new Response(`<img src="/m.png">`, { headers: { "content-type": "text/html" } }),
      "https://bodega.com/m.png": () => new Response(imagen, { headers: { "content-type": "image/png" } }),
    });
    const r = await obtenerFoto({ fotoUrl: "https://bodega.com/rota.png", paginaFoto: "https://bodega.com/malbec" }, { fetch: f, resolver: resolverPublico });
    expect(r.ok).toBe(true);
  });

  it("sin nada que bajar, devuelve el motivo", async () => {
    const { f } = fetchFalso({ "https://bodega.com/rota.png": () => new Response("no", { status: 404 }) });
    expect(await obtenerFoto({ fotoUrl: "https://bodega.com/rota.png", paginaFoto: null }, { fetch: f, resolver: resolverPublico })).toEqual({
      ok: false,
      motivo: "No se pudo descargar la foto.",
    });
    expect(await obtenerFoto({ fotoUrl: null, paginaFoto: null })).toEqual({ ok: false, motivo: null });
  });

  it("con la IA de prueba, la foto falsa se genera sin salir a internet", async () => {
    const { f, pedidas } = fetchFalso({});
    const r = await obtenerFoto({ fotoUrl: FOTO_FALSA, paginaFoto: null }, { fetch: f });
    expect(r.ok).toBe(true);
    expect(pedidas).toEqual([]);
    if (r.ok) expect((await sharp(r.datos).metadata()).format).toBe("webp");
  });
});

describe("rutaFotoSugerida", () => {
  it("una carpeta por producto, WebP con nombre único", async () => {
    const { rutaFotoSugerida } = await import("@/lib/ia/foto");
    const a = rutaFotoSugerida("p1");
    expect(a).toMatch(/^p1\/[0-9a-f-]{36}\.webp$/);
    expect(rutaFotoSugerida("p1")).not.toBe(a);
  });
});
