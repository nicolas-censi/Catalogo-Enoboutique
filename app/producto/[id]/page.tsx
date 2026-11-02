import Image from "next/image";
import { Encabezado } from "@/components/Encabezado";
import { TransicionCarta } from "@/components/TransicionCarta";
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
      <Volver href={`/seccion/${producto.seccion.id}`} texto={producto.seccion.nombre} etiqueta={textos.volverA(producto.seccion.nombre)} />
      <article className="aparecer mt-2">
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
        <h1 className="mt-4 font-titulos text-[1.75rem] leading-snug text-titulo">{producto.nombre}</h1>
        {subtitulo && <p className="mt-1 text-sm tracking-wide text-texto-suave/80">{subtitulo}</p>}
        <span aria-hidden="true" className="my-4 block h-px w-10 bg-dorado" />
        {producto.descripcion && <p className="mb-4 leading-relaxed">{producto.descripcion}</p>}
        <ListaAnadas anadas={producto.anadas} />
      </article>
    </>
  );
}

// La página se arma completa en el servidor antes de enviarse (sin Suspense), para
// que se vea aunque el celular no ejecute JavaScript (CA-9).
export const instant = false;

export default function PaginaProducto({ params }: PageProps<"/producto/[id]">) {
  return (
    <TransicionCarta>
      <Encabezado />
      <main className="mx-auto max-w-xl px-4 pb-10">
        <DetalleProducto params={params} />
      </main>
    </TransicionCarta>
  );
}
