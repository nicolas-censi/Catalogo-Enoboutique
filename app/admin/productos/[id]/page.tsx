import { leerCodigoPendiente } from "@/lib/admin/enlaces";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AccionesFicha } from "@/components/admin/AccionesFicha";
import { ConSesion } from "@/components/admin/ConSesion";
import { EditorAnadas } from "@/components/admin/EditorAnadas";
import { EditorCodigos } from "@/components/admin/EditorCodigos";
import { FormularioProducto } from "@/components/admin/FormularioProducto";
import { InterruptorVisible } from "@/components/admin/InterruptorVisible";
import { SubirFoto } from "@/components/admin/SubirFoto";
import { SugerenciaProducto } from "@/components/admin/SugerenciaProducto";
import { Pestanas } from "@/components/admin/ui/Pestanas";
import { ZonaSugerencia } from "@/components/admin/ZonaSugerencia";
import { leerFichaProducto, listarBodegas, listarSeccionesAdmin } from "@/lib/admin/productos";
import { nombreConSeccion } from "@/lib/admin/secciones";
import { urlFoto } from "@/lib/fotos";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";
import { Cargando } from "@/components/admin/ui/Cargando";

// Spec 007: pedir una sugerencia a la IA puede tardar cerca de un minuto.
export const maxDuration = 300;

const t = textos.admin;
const PESTANAS = ["datos", "anadas", "codigos"] as const;
type IdPestana = (typeof PESTANAS)[number];

async function Ficha({ params, searchParams, esEncargado }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>>; esEncargado: boolean }) {
  const [{ id }, parametros] = await Promise.all([params, searchParams]);
  const cliente = await crearClienteServidor();
  const [producto, secciones, bodegas] = await Promise.all([leerFichaProducto(cliente, id), listarSeccionesAdmin(cliente), listarBodegas(cliente)]);
  const volver = (
    <Link href="/admin" className="inline-flex min-h-11 items-center text-sm text-texto-suave before:mr-1 before:content-['‹']">
      {t.ficha.volver}
    </Link>
  );
  if (!producto) {
    return (
      <>
        {volver}
        <p className="mt-6 text-lg">{t.productoNoEncontrado}</p>
      </>
    );
  }
  const pedida = typeof parametros.pestana === "string" ? parametros.pestana : "";
  const pestana: IdPestana = (PESTANAS as readonly string[]).includes(pedida) ? (pedida as IdPestana) : "datos";
  const seccion = secciones.flatMap((s) => [{ id: s.id, nombre: s.nombre }, ...s.subsecciones.map((h) => ({ id: h.id, nombre: nombreConSeccion(s.nombre, h.nombre) }))]).find((s) => s.id === producto.seccion_id);

  return (
    <>
      {volver}
      {/* Spec 014, CA-6: encabezado con foto, nombre, bodega · sección, visible y ⋯. */}
      <div className="mt-2 flex items-start gap-4">
        {producto.foto_path ? (
          <Image src={urlFoto(producto.foto_path)} alt="" width={96} height={128} className="h-32 w-24 shrink-0 rounded-lg bg-superficie object-contain" />
        ) : (
          <span className="flex h-32 w-24 shrink-0 items-center justify-center rounded-lg bg-superficie text-xs text-texto-suave">{t.ficha.sinFoto}</span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-titulos text-2xl leading-tight">{producto.nombre}</h1>
          <p className="mt-1 text-texto-suave">{[producto.bodegas?.nombre, seccion?.nombre ?? t.sinSeccion].filter(Boolean).join(" · ")}</p>
          <div className="mt-2">
            <InterruptorVisible productoId={producto.id} visible={producto.visible} />
          </div>
        </div>
        <AccionesFicha productoId={producto.id} nombre={producto.nombre} anadas={producto.anadas.length} />
      </div>

      <section aria-label={t.sugerencias.titulo} className="mt-4">
        <ZonaSugerencia>
          <SugerenciaProducto revisar={parametros.revisar === "1"} esEncargado={esEncargado} productoId={producto.id} nombre={producto.nombre} descripcionActual={producto.descripcion} fotoActual={producto.foto_path} />
        </ZonaSugerencia>
      </section>

      <div className="mt-6">
        <Pestanas
          etiqueta={t.ficha.pestanas}
          activa={pestana}
          href={(p) => (p === "datos" ? `/admin/productos/${producto.id}` : `/admin/productos/${producto.id}?pestana=${p}`)}
          pestanas={[
            { id: "datos", etiqueta: t.ficha.datos },
            { id: "anadas", etiqueta: t.ficha.anadas(producto.anadas.length) },
            { id: "codigos", etiqueta: t.ficha.codigos(producto.codigos_barras.length) },
          ]}
        />
      </div>

      <div className="mt-6">
        {pestana === "datos" && (
          <div className="flex flex-col gap-8">
            <FormularioProducto
              productoId={producto.id}
              conVisible={false}
              inicial={{
                tipo: producto.tipo,
                nombre: producto.nombre,
                bodega: producto.bodegas?.nombre ?? "",
                varietal: producto.varietal ?? "",
                seccion: producto.seccion_id ?? "",
                descripcion: producto.descripcion ?? "",
                visible: producto.visible,
              }}
              secciones={secciones}
              bodegas={bodegas}
            />
            <section aria-label={t.foto}>
              <h2 className="mb-3 font-semibold">{t.foto}</h2>
              <SubirFoto productoId={producto.id} nombre={producto.nombre} fotoPath={producto.foto_path} />
            </section>
          </div>
        )}
        {pestana === "anadas" && <EditorAnadas productoId={producto.id} esVino={producto.tipo === "vino"} anadas={producto.anadas} />}
        {pestana === "codigos" && (
          <EditorCodigos productoId={producto.id} codigos={producto.codigos_barras.map((c) => c.codigo)} sugerido={leerCodigoPendiente(parametros.codigo) || null} />
        )}
      </div>
    </>
  );
}

export default function PaginaProductoAdmin({ params, searchParams }: PageProps<"/admin/productos/[id]">) {
  return (
    <Suspense fallback={<Cargando />}>
      <ConSesion>{(sesion) => <Ficha params={params} searchParams={searchParams} esEncargado={sesion.rol === "encargado"} />}</ConSesion>
    </Suspense>
  );
}
