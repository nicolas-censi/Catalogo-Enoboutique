import Link from "next/link";
import { ListaAnadas } from "@/components/ListaAnadas";
import type { Producto } from "@/lib/carta";

export function subtituloProducto(producto: Pick<Producto, "bodega" | "varietal">) {
  return [producto.bodega, producto.varietal].filter(Boolean).join(" · ");
}

/** `nivel` 3 cuando la tarjeta va debajo del título de una subsección (spec 011). */
export function TarjetaProducto({ producto, nivel = 2 }: { producto: Producto; nivel?: 2 | 3 }) {
  const subtitulo = subtituloProducto(producto);
  const Titulo = nivel === 2 ? "h2" : "h3";
  return (
    <article className="rounded-lg border border-dorado/30 bg-superficie px-4 py-3">
      <Titulo className="text-lg font-semibold leading-snug text-destacado">
        <Link href={`/producto/${producto.id}`} className="block min-h-11 py-1">
          {producto.nombre}
        </Link>
      </Titulo>
      {subtitulo && <p className="text-sm text-texto-suave">{subtitulo}</p>}
      <ListaAnadas anadas={producto.anadas} />
    </article>
  );
}
