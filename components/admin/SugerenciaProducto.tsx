import Image from "next/image";
import Link from "next/link";
import { AvisoSugerencia } from "@/components/admin/AvisoSugerencia";
import { BotonSugerir } from "@/components/admin/BotonSugerir";
import { RevisarSugerencia } from "@/components/admin/RevisarSugerencia";
import { iaActiva } from "@/lib/ia/ajustes";
import type { Fuente } from "@/lib/ia/tipos";
import { urlFoto } from "@/lib/fotos";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

const t = textos.admin.sugerencias;

/**
 * Spec 007: sección "Sugerencia de la IA" de la ficha. Sin sugerencia lista, el botón
 * para pedirla (CA-1); con una lista, revisarla (CA-5).
 */
export async function SugerenciaProducto({
  productoId,
  nombre,
  descripcionActual,
  fotoActual,
  esEncargado,
  revisar = false,
}: {
  /** La sugerencia se acaba de pedir: se muestra desplegada (spec 014). */
  revisar?: boolean;
  esEncargado: boolean;
  productoId: string;
  nombre: string;
  descripcionActual: string | null;
  fotoActual: string | null;
}) {
  const supabase = await crearClienteServidor();
  const { data: s } = await supabase
    .from("sugerencias")
    .select("id, estado, descripcion, motivo_sin_descripcion, foto_path, foto_sitio, motivo_sin_foto, fuentes")
    .eq("producto_id", productoId)
    .in("estado", ["en_cola", "procesando", "lista"])
    .maybeSingle();

  if (!s || s.estado !== "lista") {
    // Spec 007, CA-8: con la IA apagada no se ofrece pedir.
    if (!(await iaActiva(supabase))) {
      return (
        <p>
          {t.apagada}{" "}
          {esEncargado ? (
            <Link href="/admin/ia" className="inline-flex min-h-11 items-center underline">
              {t.prenderlas}
            </Link>
          ) : (
            t.apagadaVendedor
          )}
        </p>
      );
    }
    return (
      <div className="flex flex-col gap-2">
        {s?.estado === "en_cola" && <p>{t.enCola}</p>}
        {s?.estado === "procesando" ? <p>{t.enProceso}</p> : <BotonSugerir productoId={productoId} />}
      </div>
    );
  }

  return (
    <AvisoSugerencia abiertaAlInicio={revisar} texto={t.aviso(s.descripcion !== null, s.foto_path !== null)}>
      <TarjetaRevision sugerencia={s} nombre={nombre} descripcionActual={descripcionActual} fotoActual={fotoActual} />
    </AvisoSugerencia>
  );
}

export type SugerenciaParaRevisar = {
  id: string;
  descripcion: string | null;
  motivo_sin_descripcion: string | null;
  foto_path: string | null;
  foto_sitio: string | null;
  motivo_sin_foto: string | null;
  fuentes: unknown;
};

/** Lo actual al lado de lo sugerido, para revisar (CA-5). Se usa en la ficha y en la bandeja. */
export async function TarjetaRevision({
  sugerencia: s,
  nombre,
  descripcionActual,
  fotoActual,
  etiqueta,
  encabezado,
}: {
  etiqueta?: string;
  encabezado?: React.ReactNode;
  sugerencia: SugerenciaParaRevisar;
  nombre: string;
  descripcionActual: string | null;
  fotoActual: string | null;
}) {
  const supabase = await crearClienteServidor();
  const firmada = s.foto_path ? (await supabase.storage.from("sugerencias").createSignedUrl(s.foto_path, 600)).data?.signedUrl : null;
  const fuentes = (Array.isArray(s.fuentes) ? s.fuentes : []) as unknown as Fuente[];
  return (
    <RevisarSugerencia
      key={s.id}
      etiqueta={etiqueta}
      encabezado={encabezado}
      id={s.id}
      descripcion={s.descripcion}
      motivoSinDescripcion={s.motivo_sin_descripcion}
      hayFoto={!!firmada}
      descripcionActual={<p>{descripcionActual || t.sinDescripcionActual}</p>}
      fotoActual={
        fotoActual ? (
          <Image src={urlFoto(fotoActual)} alt={textos.admin.fotoDe(nombre)} width={160} height={240} className="h-60 w-40 rounded-md bg-superficie object-contain" />
        ) : (
          <p>{t.sinFotoActual}</p>
        )
      }
      fotoSugerida={
        firmada ? (
          <>
            <Image src={firmada} alt={t.altFoto(nombre)} width={160} height={240} unoptimized className="h-60 w-40 rounded-md bg-superficie object-contain" />
            {s.foto_sitio && <p className="mt-1 text-sm text-texto-suave">{t.fotoDe(s.foto_sitio)}</p>}
          </>
        ) : (
          <p>{s.motivo_sin_foto}</p>
        )
      }
      fuentes={
        fuentes.length > 0 && (
          <section aria-label={t.fuentes}>
            <h3 className="text-sm text-texto-suave">{t.fuentes}</h3>
            <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {fuentes.map((f) => (
                <li key={f.url}>
                  <a href={f.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex min-h-11 items-center underline">
                    {f.titulo}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )
      }
    />
  );
}
