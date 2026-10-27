import { Encabezado } from "@/components/Encabezado";
import { TarjetaProducto } from "@/components/TarjetaProducto";
import { Volver } from "@/components/Volver";
import { seccionCarta } from "@/lib/carta-cache";
import { textos } from "@/lib/textos";

async function ContenidoSeccion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const seccion = await seccionCarta(id);

  if (!seccion) {
    return <p className="mt-6 text-lg">{textos.seccionNoEncontrada}</p>;
  }

  return (
    <>
      <h1 className="mt-2 font-titulos text-2xl text-titulo">{seccion.nombre}</h1>
      <div className="mt-4 flex flex-col gap-3">
        {seccion.productos.map((producto) => (
          <TarjetaProducto key={producto.id} producto={producto} />
        ))}
      </div>
    </>
  );
}

// La página se arma completa en el servidor antes de enviarse (sin Suspense), para
// que se vea aunque el celular no ejecute JavaScript (CA-9).
export const instant = false;

export default function PaginaSeccion({ params }: PageProps<"/seccion/[id]">) {
  return (
    <>
      <Encabezado />
      <main className="mx-auto max-w-xl px-4 pb-10">
        <Volver />
        <ContenidoSeccion params={params} />
      </main>
    </>
  );
}
