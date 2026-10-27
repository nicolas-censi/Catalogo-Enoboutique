import Link from "next/link";
import { Suspense } from "react";
import { Encabezado } from "@/components/Encabezado";
import { FormularioBusqueda } from "@/components/FormularioBusqueda";
import { seccionesCarta } from "@/lib/carta-cache";
import { textos } from "@/lib/textos";

async function ListaSecciones() {
  const secciones = await seccionesCarta();
  return (
    <ul className="mt-3 divide-y divide-dorado/30 border-y border-dorado/30">
      {secciones.map((seccion) => (
        <li key={seccion.id}>
          <Link
            href={`/seccion/${seccion.id}`}
            className="flex min-h-12 items-center justify-between py-3 text-lg after:text-dorado after:content-['›']"
          >
            {seccion.nombre}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Inicio() {
  return (
    <>
      <Encabezado />
      <main className="mx-auto max-w-xl px-4 pb-10">
        <FormularioBusqueda />
        <nav aria-labelledby="titulo-secciones" className="mt-8">
          <h2 id="titulo-secciones" className="font-titulos text-xl text-dorado">
            {textos.secciones}
          </h2>
          <Suspense fallback={<div className="mt-3 h-48 animate-pulse rounded bg-dorado/10" />}>
            <ListaSecciones />
          </Suspense>
        </nav>
      </main>
    </>
  );
}
