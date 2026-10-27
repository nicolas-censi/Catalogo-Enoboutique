import Link from "next/link";
import { Suspense } from "react";
import { ConSesion } from "@/components/admin/ConSesion";
import { FormularioProducto } from "@/components/admin/FormularioProducto";
import { listarBodegas, listarSeccionesAdmin } from "@/lib/admin/productos";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

async function Alta() {
  const cliente = await crearClienteServidor();
  const [secciones, bodegas] = await Promise.all([listarSeccionesAdmin(cliente), listarBodegas(cliente)]);
  return (
    <>
      <Link href="/admin" className="inline-flex min-h-11 items-center text-titulo before:mr-1 before:content-['‹']">
        {textos.admin.volverAProductos}
      </Link>
      <h1 className="mt-2 mb-4 font-titulos text-2xl text-titulo">{textos.admin.nuevoProducto}</h1>
      <FormularioProducto
        productoId={null}
        inicial={{ tipo: "", nombre: "", bodega: "", varietal: "", seccion: "", descripcion: "", visible: true }}
        secciones={secciones}
        bodegas={bodegas}
      />
    </>
  );
}

export default function PaginaNuevoProducto() {
  return (
    <Suspense fallback={null}>
      <ConSesion>{() => <Alta />}</ConSesion>
    </Suspense>
  );
}
