import { Encabezado } from "@/components/Encabezado";
import { FormularioBusqueda } from "@/components/FormularioBusqueda";
import { ResultadosBusqueda } from "@/components/ResultadosBusqueda";
import { Volver } from "@/components/Volver";
import { busquedaCarta } from "@/lib/carta-cache";

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
      {q && <ResultadosBusqueda busqueda={q} productos={productos} />}
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
