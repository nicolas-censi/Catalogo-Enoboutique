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
      {seccion.subsecciones.length === 0 ? (
        <div className="mt-4 flex flex-col gap-3">
          {seccion.productos.map((producto) => (
            <TarjetaProducto key={producto.id} producto={producto} />
          ))}
        </div>
      ) : (
        <>
          {/* Accesos a cada subsección: enlaces a anclas, funcionan sin JavaScript. */}
          <nav aria-label={textos.subsecciones} className="mt-3 flex flex-wrap gap-2">
            {seccion.subsecciones.map((sub) => (
              <a
                key={sub.id}
                href={`#subseccion-${sub.id}`}
                className="inline-flex min-h-11 items-center rounded-full border border-dorado/60 px-4 text-titulo"
              >
                {sub.nombre}
              </a>
            ))}
          </nav>
          {seccion.subsecciones.map((sub) => (
            <section key={sub.id} id={`subseccion-${sub.id}`} aria-labelledby={`titulo-${sub.id}`} className="mt-8 scroll-mt-4">
              <h2 id={`titulo-${sub.id}`} className="font-titulos text-xl text-titulo">
                {sub.nombre}
              </h2>
              <div className="mt-3 flex flex-col gap-3">
                {sub.productos.map((producto) => (
                  <TarjetaProducto key={producto.id} producto={producto} nivel={3} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
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
