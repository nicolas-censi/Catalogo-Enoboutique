import Link from "next/link";
import { ListaAnadas } from "@/components/ListaAnadas";
import type { Producto } from "@/lib/carta";

export function subtituloProducto(producto: Pick<Producto, "bodega" | "varietal">) {
  return [producto.bodega, producto.varietal].filter(Boolean).join(" · ");
}

export function TarjetaProducto({ producto }: { producto: Producto }) {
  const subtitulo = subtituloProducto(producto);
  return (
    <article className="rounded-lg border border-dorado/30 bg-white px-4 py-3">
      <h2 className="text-lg font-semibold leading-snug">
        <Link href={`/producto/${producto.id}`} className="block min-h-11 py-1">
          {producto.nombre}
        </Link>
      </h2>
      {subtitulo && <p className="text-sm text-negro/70">{subtitulo}</p>}
      <ListaAnadas anadas={producto.anadas} />
    </article>
  );
}
