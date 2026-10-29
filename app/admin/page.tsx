import Link from "next/link";
import { Suspense } from "react";
import { ConSesion } from "@/components/admin/ConSesion";
import { FiltrosProductos } from "@/components/admin/FiltrosProductos";
import { TablaProductos } from "@/components/admin/TablaProductos";
import { leerFiltros, listarProductosAdmin, listarSeccionesAdmin, POR_PAGINA, type Filtros } from "@/lib/admin/productos";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

type Parametros = Promise<Record<string, string | string[] | undefined>>;

function enlacePagina(filtros: Filtros, pagina: number) {
  const p = new URLSearchParams();
  if (filtros.q) p.set("q", filtros.q);
  if (filtros.seccion) p.set("seccion", filtros.seccion);
  if (filtros.estado) p.set("estado", filtros.estado);
  p.set("pagina", String(pagina));
  return `/admin?${p}`;
}

async function ListaProductos({ searchParams }: { searchParams: Parametros }) {
  const parametros = await searchParams;
  const filtros = leerFiltros(parametros);
  const borrado = typeof parametros.borrado === "string" ? parametros.borrado : null;
  const cliente = await crearClienteServidor();
  const [{ productos, total }, secciones] = await Promise.all([
    listarProductosAdmin(cliente, filtros),
    listarSeccionesAdmin(cliente),
  ]);
  const desde = total === 0 ? 0 : (filtros.pagina - 1) * POR_PAGINA + 1;
  const hasta = Math.min(filtros.pagina * POR_PAGINA, total);
  const boton = "inline-flex min-h-11 items-center rounded-md border border-dorado/60 px-4";

  return (
    <>
      {borrado && (
        <p role="status" className="mb-4 rounded-md border border-dorado/60 px-4 py-3">
          {textos.admin.productoBorrado(borrado)}
        </p>
      )}
      <FiltrosProductos filtros={filtros} secciones={secciones} />
      <div className="mt-6">
        <TablaProductos productos={productos} total={total} filtros={filtros} secciones={secciones} />
      </div>
      {total > 0 && (
        <nav aria-label="Páginas" className="mt-4 flex items-center gap-3 text-texto-suave">
          <span>{textos.admin.mostrando(desde, hasta, total)}</span>
          {filtros.pagina > 1 && <Link href={enlacePagina(filtros, filtros.pagina - 1)} className={boton}>{textos.admin.paginaAnterior}</Link>}
          {hasta < total && <Link href={enlacePagina(filtros, filtros.pagina + 1)} className={boton}>{textos.admin.paginaSiguiente}</Link>}
        </nav>
      )}
    </>
  );
}

export default function PaginaPanel({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={null}>
      <ConSesion>
        {() => (
          <>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h1 className="font-titulos text-2xl text-titulo">{textos.admin.productos}</h1>
              <Link href="/admin/productos/nuevo" className="inline-flex min-h-11 items-center rounded-md bg-boton px-5 font-semibold text-boton-texto">
                {textos.admin.nuevoProducto}
              </Link>
            </div>
            <ListaProductos searchParams={searchParams} />
          </>
        )}
      </ConSesion>
    </Suspense>
  );
}
