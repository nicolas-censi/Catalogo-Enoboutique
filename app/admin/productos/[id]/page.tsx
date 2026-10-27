import Link from "next/link";
import { Suspense } from "react";
import { ConSesion } from "@/components/admin/ConSesion";
import { InterruptorStock } from "@/components/admin/InterruptorStock";
import { leerFichaProducto, type AnadaAdmin } from "@/lib/admin/productos";
import { formatearPrecio } from "@/lib/formato";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

function etiqueta(anada: AnadaAdmin) {
  if (anada.tipo === "con_anio") return String(anada.anio);
  return anada.tipo === "sin_especificar" ? textos.admin.aRevisarAnio : textos.admin.sinAnio;
}

async function Ficha({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const producto = await leerFichaProducto(await crearClienteServidor(), id);
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
  const c = textos.admin.columnasAnadas;
  return (
    <>
      {volver}
      <h1 className="mt-2 font-titulos text-2xl text-titulo">{producto.nombre}</h1>
      <h2 className="mt-6 text-lg font-semibold text-destacado">{textos.admin.anadas}</h2>
      <table className="mt-2 w-full border-collapse text-left">
        <thead className="border-b border-dorado/40 text-sm text-texto-suave">
          <tr>
            <th scope="col" className="py-2 pr-4">{c.anada}</th>
            <th scope="col" className="py-2 pr-4">{c.codigo}</th>
            <th scope="col" className="py-2 pr-4 text-right">{c.precio}</th>
            <th scope="col" className="py-2">{c.stock}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dorado/20">
          {producto.anadas.map((anada) => (
            <tr key={anada.id}>
              <td className="py-1 pr-4">{etiqueta(anada)}</td>
              <td className="py-1 pr-4 font-mono text-sm">{anada.codigo_tango}</td>
              <td className="py-1 pr-4 text-right tabular-nums">{formatearPrecio(anada.precio)}</td>
              <td className="py-1">
                <InterruptorStock anadaId={anada.id} etiqueta={etiqueta(anada)} enStock={anada.en_stock} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
