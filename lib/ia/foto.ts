// Spec 007, T4 (CA-4, CA-6): de la página oficial a una foto WebP lista para revisar.
// Todo en el servidor. La descarga revisa cada salto para no llegar a direcciones
// internas (SSRF): solo https, nombres que resuelven a IPs públicas, tamaño y tiempo
// limitados. (Queda el riesgo teórico de un DNS que cambie entre la revisión y la
// conexión; la respuesta igual tiene que ser una imagen válida.)
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import sharp from "sharp";
import { LADO_MAXIMO } from "@/lib/admin/fotos";
import { FOTO_FALSA } from "./falso";

const MAXIMO_BYTES = 10 * 1024 * 1024;
const MAXIMO_HTML = 2 * 1024 * 1024;
const ESPERA_MS = 15_000;
const SALTOS = 3;
export const MOTIVO_DESCARGA = "No se pudo descargar la foto.";

// ---------- Direcciones ----------

function ipv4Privada(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19)) || a >= 224
  );
}

/** ¿La IP es privada, local o reservada? */
export function esIpPrivada(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) return ipv4Privada(ip);
  if (v !== 6) return true;
  const baja = ip.toLowerCase();
  const mapeada = baja.match(/^::ffff:(.+)$/);
  if (mapeada) {
    const resto = mapeada[1];
    if (isIP(resto) === 4) return ipv4Privada(resto);
    const partes = resto.split(":");
    if (partes.length === 2) {
      const n = (parseInt(partes[0], 16) << 16) | parseInt(partes[1], 16);
      return ipv4Privada([n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join("."));
    }
    return true;
  }
  if (baja === "::" || baja === "::1") return true;
  return /^f[cd]/.test(baja) || /^fe[89ab]/.test(baja) || /^ff/.test(baja);
}

export type Resolver = (host: string) => Promise<string[]>;
const resolverDns: Resolver = async (host) => (await lookup(host, { all: true })).map((r) => r.address);

async function revisarDireccion(url: URL, resolver: Resolver) {
  if (url.protocol !== "https:") throw new Error("Solo se descargan direcciones https.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost")) throw new Error("Dirección privada.");
  const ips = isIP(host) ? [host] : await resolver(host);
  if (ips.length === 0 || ips.some(esIpPrivada)) throw new Error("Dirección privada.");
}

// ---------- Descarga ----------

export type OpcionesDescarga = {
  fetch?: typeof fetch;
  resolver?: Resolver;
  maximoBytes?: number;
  tipo?: RegExp;
};

async function leerLimitado(respuesta: Response, maximo: number): Promise<Buffer> {
  const largo = Number(respuesta.headers.get("content-length") ?? 0);
  if (largo > maximo) throw new Error("El archivo es demasiado pesado.");
  if (!respuesta.body) return Buffer.alloc(0);
  const partes: Uint8Array[] = [];
  let total = 0;
  const lector = respuesta.body.getReader();
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    total += value.byteLength;
    if (total > maximo) {
      await lector.cancel();
      throw new Error("El archivo es demasiado pesado.");
    }
    partes.push(value);
  }
  return Buffer.concat(partes);
}

/** Descarga una dirección pública https revisando cada redirección. */
export async function descargarSeguro(direccion: string, opciones: OpcionesDescarga = {}) {
  const { fetch: f = fetch, resolver = resolverDns, maximoBytes = MAXIMO_BYTES, tipo } = opciones;
  let url = new URL(direccion);
  for (let salto = 0; salto <= SALTOS; salto++) {
    await revisarDireccion(url, resolver);
    const respuesta = await f(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(ESPERA_MS),
      headers: { "user-agent": "Mozilla/5.0 (compatible; LehonorCarta/1.0)", accept: tipo ? "image/*" : "text/html,image/*" },
    });
    if (respuesta.status >= 300 && respuesta.status < 400 && respuesta.headers.get("location")) {
      url = new URL(respuesta.headers.get("location")!, url);
      continue;
    }
    if (!respuesta.ok) throw new Error(`Respuesta ${respuesta.status}.`);
    const contentType = respuesta.headers.get("content-type") ?? "";
    if (tipo && !tipo.test(contentType)) throw new Error("No es del tipo esperado.");
    return { url: url.toString(), contentType, datos: await leerLimitado(respuesta, maximoBytes) };
  }
  throw new Error("Demasiadas redirecciones.");
}

// ---------- Página e imagen ----------

const atributo = (etiqueta: string, nombre: string) =>
  etiqueta.match(new RegExp(`\\s${nombre}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"))?.slice(1).find((v) => v !== undefined) ?? null;

function absolutaHttps(valor: string | null, base: string): string | null {
  if (!valor) return null;
  try {
    const url = new URL(valor.trim().replace(/&amp;/g, "&"), base);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

const NO_PRODUCTO = /logo|icon|sprite|favicon|banner|placeholder|avatar|flag|bandera|loader/i;

/** La imagen principal de la página del producto (og:image, twitter:image o la primera del contenido). */
export function extraerImagen(html: string, base: string): string | null {
  const metas = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const clave of ["og:image:secure_url", "og:image", "twitter:image"]) {
    for (const m of metas) {
      if ((atributo(m, "property") ?? atributo(m, "name"))?.toLowerCase() === clave) {
        const url = absolutaHttps(atributo(m, "content"), base);
        if (url) return url;
        break;
      }
    }
  }
  for (const img of html.match(/<img\b[^>]*>/gi) ?? []) {
    const fuente = [atributo(img, "data-src"), atributo(img, "data-lazy-src"), atributo(img, "src")].find((v) => v && !v.startsWith("data:"));
    const url = absolutaHttps(fuente ?? null, base);
    if (url && !NO_PRODUCTO.test(url) && !/\.svg(\?|$)/i.test(url)) return url;
  }
  return null;
}

/** Achica a 1600 px de lado mayor (sin agrandar) y pasa a WebP. Falla si no es una imagen. */
export async function achicarAWebp(datos: Buffer): Promise<Buffer> {
  return sharp(datos, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width: LADO_MAXIMO, height: LADO_MAXIMO, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}

export type FotoObtenida = { ok: true; datos: Buffer; urlOrigen: string; sitio: string } | { ok: false; motivo: string | null };

async function bajarImagen(direccion: string, opciones: OpcionesDescarga): Promise<FotoObtenida> {
  const r = await descargarSeguro(direccion, { ...opciones, tipo: /^image\// });
  return { ok: true, datos: await achicarAWebp(r.datos), urlOrigen: r.url, sitio: new URL(r.url).hostname.replace(/^www\./, "") };
}

/**
 * Consigue la foto sugerida: primero la imagen que vio la IA; si no hay o falla, la saca
 * de la página oficial. Sin nada que intentar, motivo null (la IA ya explicó por qué).
 */
export async function obtenerFoto(
  sugerencia: { fotoUrl: string | null; paginaFoto: string | null },
  opciones: OpcionesDescarga = {},
): Promise<FotoObtenida> {
  if (sugerencia.fotoUrl === FOTO_FALSA) {
    const datos = await sharp({ create: { width: 600, height: 900, channels: 3, background: "#B19750" } }).webp().toBuffer();
    return { ok: true, datos, urlOrigen: FOTO_FALSA, sitio: "ia-falsa.invalid" };
  }
  if (!sugerencia.fotoUrl && !sugerencia.paginaFoto) return { ok: false, motivo: null };
  if (sugerencia.fotoUrl) {
    try {
      return await bajarImagen(sugerencia.fotoUrl, opciones);
    } catch {
      // Sigue con la página.
    }
  }
  if (sugerencia.paginaFoto) {
    try {
      const pagina = await descargarSeguro(sugerencia.paginaFoto, { ...opciones, maximoBytes: MAXIMO_HTML });
      if (pagina.contentType.startsWith("image/")) {
        return { ok: true, datos: await achicarAWebp(pagina.datos), urlOrigen: pagina.url, sitio: new URL(pagina.url).hostname.replace(/^www\./, "") };
      }
      const imagen = extraerImagen(pagina.datos.toString("utf8"), pagina.url);
      if (imagen) return await bajarImagen(imagen, opciones);
    } catch {
      // Sin foto.
    }
  }
  return { ok: false, motivo: MOTIVO_DESCARGA };
}

/** Ruta en el bucket privado `sugerencias`: una carpeta por producto, nombre único. */
export function rutaFotoSugerida(productoId: string): string {
  return `${productoId}/${crypto.randomUUID()}.webp`;
}
