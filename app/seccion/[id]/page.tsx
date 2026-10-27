import { Suspense } from "react";
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
      <h1 className="mt-2 font-titulos text-2xl text-dorado">{seccion.nombre}</h1>
      <div className="mt-4 flex flex-col gap-3">
        {seccion.productos.map((producto) => (
          <TarjetaProducto key={producto.id} producto={producto} />
        ))}
      </div>
    </>
  );
}

export default function PaginaSeccion({ params }: PageProps<"/seccion/[id]">) {
  return (
    <>
      <Encabezado />
      <main className="mx-auto max-w-xl px-4 pb-10">
        <Volver />
        <Suspense fallback={<div className="mt-4 h-64 animate-pulse rounded bg-dorado/10" />}>
          <ContenidoSeccion params={params} />
        </Suspense>
      </main>
    </>
  );
}
