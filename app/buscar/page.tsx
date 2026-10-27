import { Encabezado } from "@/components/Encabezado";
import { FormularioBusqueda } from "@/components/FormularioBusqueda";
import { TarjetaProducto } from "@/components/TarjetaProducto";
import { Volver } from "@/components/Volver";
import { busquedaCarta } from "@/lib/carta-cache";
import { textos } from "@/lib/textos";

type Parametros = Promise<{ [clave: string]: string | string[] | undefined }>;

function textoBuscado(valor: string | string[] | undefined): string {
  return (Array.isArray(valor) ? valor[0] : valor)?.trim() ?? "";
}

async function Resultados({ searchParams }: { searchParams: Parametros }) {
  const q = textoBuscado((await searchParams).q);
  const productos = q ? await busquedaCarta(q) : [];

  return (
    <>
      <FormularioBusqueda valor={q} />
      {q && (
        <section aria-label={textos.resultados} className="mt-6 flex flex-col gap-3">
          {productos.length > 0 ? (
            productos.map((producto) => <TarjetaProducto key={producto.id} producto={producto} />)
          ) : (
            <div className="py-6 text-center">
              <p className="text-lg">{textos.sinResultados(q)}</p>
              <p className="mt-1 text-negro/70">{textos.sinResultadosAyuda}</p>
            </div>
          )}
        </section>
      )}
    </>
  );
}

// La página se arma completa en el servidor antes de enviarse (sin Suspense), para
// que los resultados se vean aunque el celular no ejecute JavaScript (CA-9).
export const instant = false;

export default function PaginaBuscar({ searchParams }: PageProps<"/buscar">) {
  return (
    <>
      <Encabezado />
      <main className="mx-auto max-w-xl px-4 pb-10">
        <Volver />
        <div className="mt-2">
          <Resultados searchParams={searchParams} />
        </div>
      </main>
    </>
  );
}
