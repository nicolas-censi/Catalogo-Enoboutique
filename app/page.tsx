import Link from "next/link";
import { Suspense } from "react";
import { Encabezado } from "@/components/Encabezado";
import { Buscador } from "@/components/Buscador";
import { marcaCarta, seccionesCarta } from "@/lib/carta-cache";
import { textos } from "@/lib/textos";

async function ListaSecciones() {
  const secciones = await seccionesCarta();
  return (
    <ul className="mt-3 divide-y divide-dorado/30 border-y border-dorado/30">
      {secciones.map((seccion) => (
        <li key={seccion.id}>
          <Link
            href={`/seccion/${seccion.id}`}
            className="flex min-h-12 items-center justify-between py-3 text-lg text-destacado after:text-dorado after:content-['›']"
          >
            {seccion.nombre}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Texto de bienvenida que carga el encargado (spec 006); vacío no se muestra. */
async function Bienvenida() {
  const { bienvenida } = await marcaCarta();
  return bienvenida ? <p className="mb-6 text-center text-lg text-texto-suave">{bienvenida}</p> : null;
}

export default function Inicio() {
  return (
    <>
      <Encabezado />
      <main className="mx-auto max-w-xl px-4 pb-10">
        <Suspense fallback={null}>
          <Bienvenida />
        </Suspense>
        <Buscador />
        <nav aria-labelledby="titulo-secciones" className="mt-8">
          <h2 id="titulo-secciones" className="font-titulos text-xl text-titulo">
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
