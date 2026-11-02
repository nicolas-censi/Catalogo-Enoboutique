import Link from "next/link";
import { Suspense } from "react";
import { Encabezado } from "@/components/Encabezado";
import { TransicionCarta } from "@/components/TransicionCarta";
import { Buscador } from "@/components/Buscador";
import { marcaCarta, seccionesCarta } from "@/lib/carta-cache";
import { textos } from "@/lib/textos";

async function ListaSecciones() {
  const secciones = await seccionesCarta();
  return (
    <ul className="mt-2 flex flex-col items-center">
      {secciones.map((seccion, i) => (
        <li key={seccion.id} className="aparecer" style={{ "--i": i } as React.CSSProperties}>
          <Link
            href={`/seccion/${seccion.id}`}
            className="tocable flex min-h-12 items-center px-2 font-titulos text-[1.375rem] text-destacado hover:text-texto"
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
  return bienvenida ? <p className="mb-2 text-center font-titulos text-[0.9375rem] leading-relaxed text-texto">{bienvenida}</p> : null;
}

/** Inicio (spec 013, propuesta C): logo grande, bienvenida, buscador y secciones centradas. */
export default function Inicio() {
  return (
    <TransicionCarta>
      <Encabezado grande />
      <main className="mx-auto max-w-xl px-6 pb-10">
        <Suspense fallback={null}>
          <Bienvenida />
        </Suspense>
        <div className="mt-6">
          <Buscador />
        </div>
        <nav aria-labelledby="titulo-secciones" className="mt-8">
          <h2 id="titulo-secciones" className="sr-only">
            {textos.secciones}
          </h2>
          <Suspense fallback={<div className="mt-3 h-64 animate-pulse rounded bg-dorado/10" />}>
            <ListaSecciones />
          </Suspense>
        </nav>
      </main>
    </TransicionCarta>
  );
}
