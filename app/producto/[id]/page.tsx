import Image from "next/image";
import Link from "next/link";
import { Encabezado } from "@/components/Encabezado";
import { ListaAnadas } from "@/components/ListaAnadas";
import { subtituloProducto } from "@/components/TarjetaProducto";
import { Volver } from "@/components/Volver";
import { productoCarta } from "@/lib/carta-cache";
import { urlFoto } from "@/lib/fotos";
import { textos } from "@/lib/textos";

async function DetalleProducto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const producto = await productoCarta(id);

  if (!producto) {
    return (
      <>
        <Volver />
        <p className="mt-6 text-lg">{textos.productoNoEncontrado}</p>
      </>
    );
  }

  const subtitulo = subtituloProducto(producto);
  return (
    <>
      <Link
        href={`/seccion/${producto.seccion.id}`}
        className="inline-flex min-h-11 items-center text-dorado before:mr-1 before:content-['‹']"
      >
        {textos.volverA(producto.seccion.nombre)}
      </Link>
      <article className="mt-2">
        {producto.fotoPath && (
          <Image
            src={urlFoto(producto.fotoPath)}
            alt={producto.nombre}
            width={600}
            height={800}
            sizes="(max-width: 640px) 100vw, 576px"
            className="mx-auto max-h-96 w-auto object-contain"
            priority
          />
        )}
        <h1 className="mt-4 font-titulos text-2xl leading-snug text-dorado">{producto.nombre}</h1>
        {subtitulo && <p className="mt-1 text-negro/70">{subtitulo}</p>}
        {producto.descripcion && <p className="mt-4 leading-relaxed">{producto.descripcion}</p>}
        <div className="mt-4 rounded-lg border border-dorado/30 bg-white px-4 py-2">
          <ListaAnadas anadas={producto.anadas} />
        </div>
      </article>
    </>
  );
}

// La página se arma completa en el servidor antes de enviarse (sin Suspense), para
// que se vea aunque el celular no ejecute JavaScript (CA-9).
export const instant = false;

export default function PaginaProducto({ params }: PageProps<"/producto/[id]">) {
  return (
    <>
      <Encabezado />
      <main className="mx-auto max-w-xl px-4 pb-10">
        <DetalleProducto params={params} />
      </main>
    </>
  );
}
