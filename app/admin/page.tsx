import Link from "next/link";
import { Suspense } from "react";
import { enlaceLista } from "@/lib/admin/enlaces";
import { ConSesion } from "@/components/admin/ConSesion";
import { claseBoton } from "@/components/admin/ui/boton";
import { FiltrosProductos } from "@/components/admin/FiltrosProductos";
import { TablaProductos } from "@/components/admin/TablaProductos";
import { leerFiltros, listarProductosAdmin, listarSeccionesAdmin, POR_PAGINA } from "@/lib/admin/productos";
import { iaActiva } from "@/lib/ia/ajustes";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";
import { Cargando } from "@/components/admin/ui/Cargando";

type Parametros = Promise<Record<string, string | string[] | undefined>>;

async function ListaProductos({ searchParams }: { searchParams: Parametros }) {
  const parametros = await searchParams;
  const filtros = leerFiltros(parametros);
  const borrado = typeof parametros.borrado === "string" ? parametros.borrado : null;
  const cliente = await crearClienteServidor();
  const [{ productos, total }, secciones, iaPrendida] = await Promise.all([
    listarProductosAdmin(cliente, filtros),
    listarSeccionesAdmin(cliente),
    iaActiva(cliente),
  ]);
  const desde = total === 0 ? 0 : (filtros.pagina - 1) * POR_PAGINA + 1;
  const hasta = Math.min(filtros.pagina * POR_PAGINA, total);
  const boton = claseBoton("secundario");

  return (
    <>
      {borrado && (
        <p role="status" className="mb-4 rounded-md border border-control px-4 py-3">
          {textos.admin.productoBorrado(borrado)}
        </p>
      )}
      <FiltrosProductos filtros={filtros} secciones={secciones} />
      <div className="mt-5">
        <TablaProductos productos={productos} total={total} filtros={filtros} secciones={secciones} iaActiva={iaPrendida} />
      </div>
      {total > 0 && (
        <nav aria-label="Páginas" className="mt-4 flex items-center gap-3 text-texto-suave">
          <span>{textos.admin.mostrando(desde, hasta, total)}</span>
          {filtros.pagina > 1 && <Link href={enlaceLista(filtros, { pagina: filtros.pagina - 1 })} className={boton}>{textos.admin.paginaAnterior}</Link>}
          {hasta < total && <Link href={enlaceLista(filtros, { pagina: filtros.pagina + 1 })} className={boton}>{textos.admin.paginaSiguiente}</Link>}
        </nav>
      )}
    </>
  );
}

export default function PaginaPanel({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<Cargando />}>
      <ConSesion>
        {() => (
          <>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h1 className="font-titulos text-2xl">{textos.admin.productos}</h1>
              <Link href="/admin/productos/nuevo" className={claseBoton("principal")}>
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
