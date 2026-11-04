import { Encabezado } from "@/components/Encabezado";
import { TransicionCarta } from "@/components/TransicionCarta";
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
      {/* Encabezado de sección (spec 013, propuesta C): nombre grande y centrado, línea
          dorada y las subsecciones como enlaces. */}
      <div className="mt-3 flex flex-col items-center text-center">
        <h1 className="font-titulos text-[2.5rem] leading-snug text-titulo">{seccion.nombre}</h1>
        <span aria-hidden="true" className="my-3 h-px w-10 bg-dorado" />
        {seccion.subsecciones.length > 0 && (
          // Enlaces a anclas: funcionan sin JavaScript.
          <nav aria-label={textos.subsecciones} className="flex flex-wrap justify-center gap-x-5">
            {seccion.subsecciones.map((sub) => (
              <a
                key={sub.id}
                href={`#subseccion-${sub.id}`}
                className="tocable inline-flex min-h-11 items-center border-b border-dorado/50 text-[0.9375rem] text-texto hover:border-dorado"
              >
                {sub.nombre}
              </a>
            ))}
          </nav>
        )}
      </div>
      {seccion.subsecciones.length === 0 ? (
        <div className="mt-4 flex flex-col">
          {seccion.productos.map((producto, i) => (
            <TarjetaProducto key={producto.id} producto={producto} posicion={i} />
          ))}
        </div>
      ) : (
        seccion.subsecciones.map((sub) => (
          <section key={sub.id} id={`subseccion-${sub.id}`} aria-labelledby={`titulo-${sub.id}`} className="mt-8 scroll-mt-4">
            <div className="flex items-center gap-3">
              <h2 id={`titulo-${sub.id}`} className="font-titulos text-xl text-titulo">
                {sub.nombre}
              </h2>
              <span aria-hidden="true" className="h-px flex-1 bg-dorado/35" />
            </div>
            <div className="mt-1 flex flex-col">
              {sub.productos.map((producto, i) => (
                <TarjetaProducto key={producto.id} producto={producto} nivel={3} posicion={i} />
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}

// La página se arma completa en el servidor antes de enviarse (sin Suspense), para
// que se vea aunque el celular no ejecute JavaScript (CA-9).
export const instant = false;

export default function PaginaSeccion({ params }: PageProps<"/seccion/[id]">) {
  return (
    <TransicionCarta>
      <Encabezado />
      <main className="mx-auto max-w-xl px-4 pb-10">
        <Volver />
        <ContenidoSeccion params={params} />
      </main>
    </TransicionCarta>
  );
}
