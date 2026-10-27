import Link from "next/link";
import { Suspense } from "react";
import { BorrarProducto } from "@/components/admin/BorrarProducto";
import { ConSesion } from "@/components/admin/ConSesion";
import { FormularioProducto } from "@/components/admin/FormularioProducto";
import { EditorAnadas } from "@/components/admin/EditorAnadas";
import { EditorCodigos } from "@/components/admin/EditorCodigos";
import { SubirFoto } from "@/components/admin/SubirFoto";
import { leerFichaProducto, listarBodegas, listarSeccionesAdmin } from "@/lib/admin/productos";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

async function Ficha({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cliente = await crearClienteServidor();
  const [producto, secciones, bodegas] = await Promise.all([
    leerFichaProducto(cliente, id),
    listarSeccionesAdmin(cliente),
    listarBodegas(cliente),
  ]);
  const volver = (
    <Link href="/admin" className="inline-flex min-h-11 items-center text-titulo before:mr-1 before:content-['‹']">
      {textos.admin.volverAProductos}
    </Link>
  );
  if (!producto) {
    return (
      <>
        {volver}
        <p className="mt-6 text-lg">{textos.admin.productoNoEncontrado}</p>
      </>
    );
  }
  return (
    <>
      {volver}
      <h1 className="mt-2 font-titulos text-2xl text-titulo">{producto.nombre}</h1>
      <h2 className="mt-6 mb-3 text-lg font-semibold text-destacado">{textos.admin.datosProducto}</h2>
      <FormularioProducto
        productoId={producto.id}
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
      <h2 className="mt-8 mb-3 text-lg font-semibold text-destacado">{textos.admin.foto}</h2>
      <SubirFoto productoId={producto.id} nombre={producto.nombre} fotoPath={producto.foto_path} />
      <h2 className="mt-8 text-lg font-semibold text-destacado">{textos.admin.anadas}</h2>
      <EditorAnadas productoId={producto.id} esVino={producto.tipo === "vino"} anadas={producto.anadas} />
      <h2 className="mt-8 mb-3 text-lg font-semibold text-destacado">{textos.admin.codigosBarras}</h2>
      <EditorCodigos productoId={producto.id} codigos={producto.codigos_barras.map((c) => c.codigo)} />
      <h2 className="mt-10 mb-3 text-lg font-semibold text-destacado">{textos.admin.zonaPeligro}</h2>
      <BorrarProducto productoId={producto.id} nombre={producto.nombre} anadas={producto.anadas.length} />
    </>
  );
}

export default function PaginaProductoAdmin({ params }: PageProps<"/admin/productos/[id]">) {
  return (
    <Suspense fallback={null}>
      <ConSesion>{() => <Ficha params={params} />}</ConSesion>
    </Suspense>
  );
}
