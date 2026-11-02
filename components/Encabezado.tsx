import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import logoOriginal from "@/public/logo-enoboutique.png";
import { marcaCarta } from "@/lib/carta-cache";
import { urlLogo } from "@/lib/fotos";
import { textos } from "@/lib/textos";

const clase = "h-14 w-auto";

/** El logo que subió el encargado (spec 006) o el original de la marca. */
async function Logo() {
  const { logoPath } = await marcaCarta();
  if (!logoPath) return <Image src={logoOriginal} alt={textos.nombreCarta} priority className={clase} />;
  // Las medidas reales del logo subido no se conocen: manda el alto (h-14).
  return <Image src={urlLogo(logoPath)} alt={textos.nombreCarta} width={480} height={270} priority className={clase} />;
}

export function Encabezado() {
  return (
    <header className="flex justify-center px-4 pt-6 pb-4">
      <Link href="/" className="inline-block min-h-11">
        {/* Mientras se lee la marca, el logo original (mismo tamaño: no salta nada). */}
        <Suspense fallback={<Image src={logoOriginal} alt={textos.nombreCarta} priority className={clase} />}>
          <Logo />
        </Suspense>
      </Link>
    </header>
  );
}
