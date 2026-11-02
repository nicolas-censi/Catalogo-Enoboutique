import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import logoOriginal from "@/public/logo-enoboutique.png";
import { marcaCarta } from "@/lib/carta-cache";
import { urlLogo } from "@/lib/fotos";
import { textos } from "@/lib/textos";

/** El logo que subió el encargado (spec 006) o el original de la marca. */
async function Logo({ clase }: { clase: string }) {
  const { logoPath } = await marcaCarta();
  if (!logoPath) return <Image src={logoOriginal} alt={textos.nombreCarta} priority className={clase} />;
  // Las medidas reales del logo subido no se conocen: manda el alto (h-14).
  return <Image src={urlLogo(logoPath)} alt={textos.nombreCarta} width={480} height={270} priority className={clase} />;
}

/**
 * Encabezado de la carta (spec 013): en el inicio, el logo grande con una línea dorada
 * debajo; en el resto de las páginas, el logo chico.
 */
export function Encabezado({ grande = false }: { grande?: boolean }) {
  const clase = grande ? "h-20 w-auto" : "h-9 w-auto";
  return (
    <header className={`flex flex-col items-center px-4 ${grande ? "pt-12" : "pt-5 pb-1"}`}>
      <Link href="/" className="tocable inline-block min-h-11">
        {/* Mientras se lee la marca, el logo original (mismo tamaño: no salta nada). */}
        <Suspense fallback={<Image src={logoOriginal} alt={textos.nombreCarta} priority className={clase} />}>
          <Logo clase={clase} />
        </Suspense>
      </Link>
      {grande && <span aria-hidden="true" className="mt-5 mb-4 h-px w-10 bg-dorado" />}
    </header>
  );
}
