// Copia el lector de códigos (WebAssembly de ZXing) a public/, en una carpeta con su
// versión, para servirlo desde el propio sitio (no desde un CDN). Corre antes de
// `npm run dev` y `npm run build`. La carpeta public/zxing no se versiona.
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const raiz = join(process.cwd(), "node_modules", "zxing-wasm");
const { version } = JSON.parse(readFileSync(join(raiz, "package.json"), "utf8"));
const destino = join(process.cwd(), "public", "zxing", version);
const archivo = join(destino, "zxing_reader.wasm");
if (!existsSync(archivo)) {
  mkdirSync(destino, { recursive: true });
  copyFileSync(join(raiz, "dist", "reader", "zxing_reader.wasm"), archivo);
  console.log(`Lector de códigos copiado a public/zxing/${version}/`);
}
