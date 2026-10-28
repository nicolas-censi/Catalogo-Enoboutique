// Lector de códigos de barras en el navegador: usa el nativo (BarcodeDetector) cuando
// existe y soporta los formatos de las botellas; si no (por ejemplo, Safari en iPhone),
// carga la librería ZXing (WebAssembly) servida desde el propio sitio. Se importa solo
// desde el escáner, así la carta no descarga nada de esto (spec 003, CA-6).
import { FORMATOS } from "@/lib/escaneo";

export type Lectura = { rawValue: string; format: string };
export type Lector = { detect(fuente: CanvasImageSource): Promise<Lectura[]> };

type ConstructorLector = {
  new (opciones: { formats: string[] }): Lector;
  getSupportedFormats(): Promise<string[]>;
};

export async function crearLector(): Promise<Lector> {
  const nativo = (globalThis as unknown as { BarcodeDetector?: ConstructorLector }).BarcodeDetector;
  if (nativo) {
    const soportados = await nativo.getSupportedFormats().catch(() => [] as string[]);
    if (FORMATOS.every((f) => soportados.includes(f))) return new nativo({ formats: [...FORMATOS] });
  }
  const { BarcodeDetector, prepareZXingModule, ZXING_WASM_VERSION } = await import("barcode-detector/ponyfill");
  prepareZXingModule({
    overrides: {
      locateFile: (ruta: string, prefijo: string) =>
        ruta.endsWith(".wasm") ? `/zxing/${ZXING_WASM_VERSION}/${ruta}` : prefijo + ruta,
    },
  });
  return new BarcodeDetector({ formats: [...FORMATOS] });
}
