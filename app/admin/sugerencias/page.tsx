import Link from "next/link";
import { Suspense } from "react";
import { BotonReintentar } from "@/components/admin/BotonReintentar";
import { ConSesion } from "@/components/admin/ConSesion";
import { ProcesadorCola } from "@/components/admin/ProcesadorCola";
import { TarjetaRevision } from "@/components/admin/SugerenciaProducto";
import { ZonaSugerencia } from "@/components/admin/ZonaSugerencia";
import { iaActiva } from "@/lib/ia/ajustes";
import { contarEnCola } from "@/lib/ia/cola-servidor";
import { AJUSTE_REAL } from "@/lib/ia/costo";
import { formatearDolares } from "@/lib/formato";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

const t = textos.admin.paraRevisar;
const POR_PAGINA = 20;

// Cada tanda de la cola puede tardar cerca de un minuto.
export const maxDuration = 300;

async function Bandeja() {
  const supabase = await crearClienteServidor();
  const [listas, enCola, fallidas, prendida, resumen] = await Promise.all([
    supabase
      .from("sugerencias")
      .select(
        "id, descripcion, motivo_sin_descripcion, foto_path, foto_sitio, motivo_sin_foto, fuentes, productos(id, nombre, descripcion, foto_path)",
        { count: "exact" },
      )
      .eq("estado", "lista")
      .order("procesada_en")
      .limit(POR_PAGINA),
    contarEnCola(supabase),
    supabase.from("sugerencias").select("producto_id").eq("estado", "fallo"),
    iaActiva(supabase),
    supabase.rpc("resumen_ia_mes"),
  ]);
  const total = listas.count ?? 0;
  const cantidadFallidas = new Set((fallidas.data ?? []).map((f) => f.producto_id)).size;
  const gastado = Number(resumen.data?.[0]?.costo_usd ?? 0) * AJUSTE_REAL;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-texto-suave">{t.gastado(formatearDolares(gastado))}</p>
      <ProcesadorCola key={`${prendida}-${enCola > 0}`} enCola={enCola} iaActiva={prendida} />
      {cantidadFallidas > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <p>{t.fallidas(cantidadFallidas)}</p>
          <BotonReintentar />
        </div>
      )}
      {total === 0 ? (
        <p>{t.vacia}</p>
      ) : (
        <ZonaSugerencia>
          {total > POR_PAGINA && <p className="text-sm text-texto-suave">{t.mostrando(POR_PAGINA, total)}</p>}
          <ul className="flex flex-col gap-6">
            {(listas.data ?? []).map((s) =>
              s.productos ? (
                <li key={s.id}>
                  <TarjetaRevision
                    sugerencia={s}
                    nombre={s.productos.nombre}
                    descripcionActual={s.productos.descripcion}
                    fotoActual={s.productos.foto_path}
                    etiqueta={t.sugerenciaPara(s.productos.nombre)}
                    encabezado={
                      <h2 className="font-titulos text-lg text-titulo">
                        <Link href={`/admin/productos/${s.productos.id}`} aria-label={t.verFicha(s.productos.nombre)} className="inline-flex min-h-11 items-center underline">
                          {s.productos.nombre}
                        </Link>
                      </h2>
                    }
                  />
                </li>
              ) : null,
            )}
          </ul>
        </ZonaSugerencia>
      )}
    </div>
  );
}

export default function PaginaParaRevisar() {
  return (
    <Suspense fallback={null}>
      <ConSesion>
        {() => (
          <>
            <h1 className="font-titulos text-2xl text-titulo">{t.titulo}</h1>
            <p className="mt-2 mb-6 max-w-prose text-texto-suave">{t.ayuda}</p>
            <Bandeja />
          </>
        )}
      </ConSesion>
    </Suspense>
  );
}
