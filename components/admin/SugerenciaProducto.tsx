import Image from "next/image";
import { BotonSugerir } from "@/components/admin/BotonSugerir";
import { RevisarSugerencia } from "@/components/admin/RevisarSugerencia";
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
}: {
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
    return (
      <div className="flex flex-col gap-2">
        {s?.estado === "en_cola" && <p>{t.enCola}</p>}
        {s?.estado === "procesando" ? <p>{t.enProceso}</p> : <BotonSugerir productoId={productoId} />}
      </div>
    );
  }

  const firmada = s.foto_path ? (await supabase.storage.from("sugerencias").createSignedUrl(s.foto_path, 600)).data?.signedUrl : null;
  const fuentes = (Array.isArray(s.fuentes) ? s.fuentes : []) as unknown as Fuente[];
  return (
    <RevisarSugerencia
      key={s.id}
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
