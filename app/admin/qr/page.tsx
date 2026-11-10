import { Suspense } from "react";
import { BotonImprimir } from "@/components/admin/BotonImprimir";
import { ConSesion } from "@/components/admin/ConSesion";
import { TarjetaQr } from "@/components/admin/TarjetaQr";
import { Cargando } from "@/components/admin/ui/Cargando";
import { leerMarca } from "@/lib/carta";
import { urlCarta } from "@/lib/qr";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

const t = textos.admin.qr;

async function Tarjeta() {
  const { logoPath } = await leerMarca(await crearClienteServidor());
  return <TarjetaQr url={urlCarta()} logoPath={logoPath} />;
}

/** Spec 009, CA-4: la tarjeta de mesa con el QR, lista para imprimir (solo encargado). */
export default function PaginaQr() {
  return (
    <Suspense fallback={<Cargando />}>
      <ConSesion soloEncargado>
        {() => (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-titulos text-2xl">{t.titulo}</h1>
                <p className="mt-2 max-w-prose text-texto-suave">{t.ayuda}</p>
              </div>
              <BotonImprimir />
            </div>
            <div className="mt-6 overflow-x-auto">
              <Tarjeta />
            </div>
          </>
        )}
      </ConSesion>
    </Suspense>
  );
}
