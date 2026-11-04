import Link from "next/link";
import { ListaAnadas } from "@/components/ListaAnadas";
import type { Producto } from "@/lib/carta";

export function subtituloProducto(producto: Pick<Producto, "bodega" | "varietal">) {
  return [producto.bodega, producto.varietal].filter(Boolean).join(" · ");
}

/**
 * Vino en el listado, estilo editorial (spec 013): nombre en la tipografía de títulos,
 * bodega · varietal y las añadas con puntos guía. `nivel` 3 cuando va debajo del título
 * de una subsección (spec 011); `posicion` escalona su aparición.
 */
export function TarjetaProducto({ producto, nivel = 2, posicion = 0 }: { producto: Producto; nivel?: 2 | 3; posicion?: number }) {
  const subtitulo = subtituloProducto(producto);
  const Titulo = nivel === 2 ? "h2" : "h3";
  return (
    <article className="aparecer border-b border-dorado/20 py-4" style={{ "--i": posicion } as React.CSSProperties}>
      <Titulo className="font-titulos text-lg leading-snug text-destacado">
        <Link href={`/producto/${producto.id}`} className="tocable flex min-h-12 items-center py-1">
          {producto.nombre}
        </Link>
      </Titulo>
      {subtitulo && <p className="text-sm text-texto-suave/80">{subtitulo}</p>}
      <ListaAnadas anadas={producto.anadas} />
    </article>
  );
}
