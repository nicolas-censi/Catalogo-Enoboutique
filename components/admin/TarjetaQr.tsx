import Image from "next/image";
import { modulosQr, urlVisible } from "@/lib/qr";
import { urlLogo } from "@/lib/fotos";
import { textos } from "@/lib/textos";
import logoOriginal from "@/public/logo-enoboutique.png";

const t = textos.admin.qr;

/** Spec 009, CA-4: tarjeta de mesa de 10 × 15 cm con el logo y el QR de la carta. */
export function TarjetaQr({ url, logoPath }: { url: string; logoPath: string | null }) {
  const { tamano, oscuro } = modulosQr(url);
  const margen = 2;
  let d = "";
  for (let y = 0; y < tamano; y++) for (let x = 0; x < tamano; x++) if (oscuro(x, y)) d += `M${x + margen} ${y + margen}h1v1h-1z`;
  const lado = tamano + margen * 2;
  return (
    <article
      aria-label={t.tarjeta}
      className="tarjeta-qr flex h-[150mm] w-[100mm] flex-col items-center justify-between rounded-xl bg-carta-fondo px-[10mm] py-[12mm] text-carta-texto"
    >
      {logoPath ? (
        <Image src={urlLogo(logoPath)} alt={textos.nombreCarta} width={480} height={270} unoptimized className="h-[18mm] w-auto" />
      ) : (
        <Image src={logoOriginal} alt={textos.nombreCarta} className="h-[18mm] w-auto" />
      )}
      <div className="flex flex-col items-center gap-[5mm]">
        <div className="rounded-lg bg-carta-texto p-[3mm] text-carta-fondo">
          <svg role="img" aria-label={t.qr(urlVisible(url))} viewBox={`0 0 ${lado} ${lado}`} className="block size-[56mm]" shapeRendering="crispEdges">
            <path d={d} fill="currentColor" />
          </svg>
        </div>
        <p className="text-center font-titulos text-[5.5mm] leading-tight text-dorado">{t.escanea}</p>
      </div>
      <p className="text-[3.5mm] tracking-wide">{urlVisible(url)}</p>
    </article>
  );
}
