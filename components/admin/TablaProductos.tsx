import Link from "next/link";
import type { ProductoAdmin } from "@/lib/admin/productos";
import { nombreConSeccion } from "@/lib/admin/secciones";
import { textos } from "@/lib/textos";

function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <span className="mr-1 inline-block rounded border border-dorado/60 px-2 py-0.5 text-sm text-destacado">
      {children}
    </span>
  );
}

function Estado({ producto }: { producto: ProductoAdmin }) {
  return (
    <>
      {!producto.visible && <Etiqueta>{textos.admin.oculto}</Etiqueta>}
      {producto.anadas_en_stock === 0 && <Etiqueta>{textos.admin.sinStock}</Etiqueta>}
      {!producto.foto_path && <Etiqueta>{textos.admin.sinFoto}</Etiqueta>}
      {(producto.anadas_a_revisar ?? 0) > 0 && <Etiqueta>{textos.admin.aRevisar(producto.anadas_a_revisar!)}</Etiqueta>}
    </>
  );
}

export function TablaProductos({ productos }: { productos: ProductoAdmin[] }) {
  if (productos.length === 0) {
    return <p className="py-8 text-center text-texto-suave">{textos.admin.sinResultados}</p>;
  }
  const c = textos.admin.columnas;
  return (
    <table className="tabla-responsiva w-full border-collapse text-left">
      <thead className="border-b border-dorado/40 text-sm text-texto-suave">
        <tr>
          <th scope="col" className="py-2 pr-4">{c.producto}</th>
          <th scope="col" className="py-2 pr-4">{c.bodega}</th>
          <th scope="col" className="py-2 pr-4">{c.seccion}</th>
          <th scope="col" className="py-2 pr-4 text-right">{c.anadas}</th>
          <th scope="col" className="py-2">{c.estado}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-dorado/20">
        {productos.map((p) => (
          <tr key={p.id}>
            <td className="py-1 pr-4">
              <Link href={`/admin/productos/${p.id}`} className="inline-flex min-h-11 items-center text-destacado hover:underline">
                {p.nombre}
              </Link>
            </td>
            <td data-etiqueta={c.bodega} className="py-1 pr-4">{p.bodega_nombre}</td>
            <td data-etiqueta={c.seccion} className="py-1 pr-4">{p.seccion_nombre ? (
                p.seccion_padre_nombre ? nombreConSeccion(p.seccion_padre_nombre, p.seccion_nombre) : p.seccion_nombre
              ) : (
                <span className="text-texto-suave">{textos.admin.sinSeccion}</span>
              )}</td>
            <td data-etiqueta={c.anadas} className="py-1 pr-4 tabular-nums md:text-right">{p.cantidad_anadas}</td>
            <td className="py-1"><Estado producto={p} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
