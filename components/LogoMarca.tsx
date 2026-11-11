import Image from "next/image";
import { Suspense } from "react";
import logoOriginal from "@/public/logo-enoboutique.png";
import { marcaCarta } from "@/lib/carta-cache";
import { urlLogo } from "@/lib/fotos";
import { textos } from "@/lib/textos";

/** El logo que subió el encargado (spec 006) o el original de la marca. */
async function Logo({ clase }: { clase: string }) {
  const { logoPath } = await marcaCarta();
  if (!logoPath) return <Image src={logoOriginal} alt={textos.nombreCarta} priority className={clase} />;
  // Las medidas reales del logo subido no se conocen: manda el alto de la clase.
  return <Image src={urlLogo(logoPath)} alt={textos.nombreCarta} width={480} height={270} priority className={clase} />;
}

/**
 * Logo de la marca, para la carta (spec 013) y el panel (spec 017). Mientras se lee la
 * marca, el logo original (mismo alto: no salta nada). Un logo muy ancho no se sale.
 */
export function LogoMarca({ clase }: { clase: string }) {
  const conAncho = `${clase} max-w-full object-contain`;
  return (
    <Suspense fallback={<Image src={logoOriginal} alt={textos.nombreCarta} priority className={conAncho} />}>
      <Logo clase={conAncho} />
    </Suspense>
  );
}
