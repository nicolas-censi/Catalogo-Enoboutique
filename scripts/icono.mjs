// Spec 018: genera el ícono de la web a partir del isotipo de la marca.
// Uso: npm run icono  (escribe app/favicon.ico, app/icon.png y app/apple-icon.png)
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const raiz = process.cwd();
const ORIGEN = join(raiz, "assets", "marca", "isotipo.png");
const TRANSPARENTE = { r: 0, g: 0, b: 0, alpha: 0 };
const CREMA = { r: 0xf6, g: 0xf2, b: 0xe9, alpha: 1 };

const CASI_NEGRO = "#1B1A17";

/**
 * El isotipo (recortado a su dibujo) al 80 % de un círculo casi negro, así el dorado se
 * lee en pestañas claras y oscuras. El círculo ocupa el cuadrado de `lado` menos `margen`
 * (0–1) de cada lado; alrededor, `fondo`.
 */
async function cuadrado(lado, { fondo = TRANSPARENTE, margen = 0 } = {}) {
  const diametro = Math.round(lado * (1 - 2 * margen));
  const dibujo = await sharp(ORIGEN).trim({ threshold: 10 }).toBuffer();
  const interior = Math.round(diametro * 0.8);
  const ajustado = await sharp(dibujo).resize(interior, interior, { fit: "contain", background: TRANSPARENTE }).toBuffer();
  const r = diametro / 2;
  const circulo = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${diametro}" height="${diametro}"><circle cx="${r}" cy="${r}" r="${r}" fill="${CASI_NEGRO}"/></svg>`);
  const disco = await sharp(circulo).composite([{ input: ajustado, gravity: "center" }]).png().toBuffer();
  return sharp({ create: { width: lado, height: lado, channels: 4, background: fondo } })
    .composite([{ input: disco, gravity: "center" }])
    .png({ palette: true, quality: 90, compressionLevel: 9, effort: 10 })
    .toBuffer();
}

/** .ico con imágenes PNG adentro (lo leen todos los navegadores actuales). */
function ico(pngs) {
  const cabecera = Buffer.alloc(6 + 16 * pngs.length);
  cabecera.writeUInt16LE(0, 0);
  cabecera.writeUInt16LE(1, 2);
  cabecera.writeUInt16LE(pngs.length, 4);
  let desplazamiento = cabecera.length;
  pngs.forEach(({ lado, datos }, i) => {
    const e = 6 + i * 16;
    cabecera[e] = lado % 256;
    cabecera[e + 1] = lado % 256;
    cabecera.writeUInt16LE(1, e + 4); // planos
    cabecera.writeUInt16LE(32, e + 6); // bits por píxel
    cabecera.writeUInt32LE(datos.length, e + 8);
    cabecera.writeUInt32LE(desplazamiento, e + 12);
    desplazamiento += datos.length;
  });
  return Buffer.concat([cabecera, ...pngs.map((p) => p.datos)]);
}

const pestana = await Promise.all([16, 32, 48].map(async (lado) => ({ lado, datos: await cuadrado(lado) })));
writeFileSync(join(raiz, "app", "favicon.ico"), ico(pestana));
writeFileSync(join(raiz, "app", "icon.png"), await cuadrado(512));
writeFileSync(join(raiz, "app", "apple-icon.png"), await sharp(await cuadrado(180, { fondo: CREMA, margen: 0.06 })).flatten({ background: CREMA }).png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer());
console.log("Listo: app/favicon.ico, app/icon.png y app/apple-icon.png");
