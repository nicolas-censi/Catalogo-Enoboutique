import type { Metadata } from "next";
import { Encabezado } from "@/components/Encabezado";
import { EscanerDiferido } from "@/components/EscanerDiferido";
import { Volver } from "@/components/Volver";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: `${textos.escaner.titulo} · ${textos.nombreCarta}` };

const t = textos.escaner;

/** Escribir el número a mano: funciona sin cámara y sin JavaScript (va a /buscar). */
function IngresoManual() {
  return (
    <form action="/buscar" method="get" className="mt-8 flex flex-col gap-2">
      <h2 className="text-lg text-destacado">{t.manualTitulo}</h2>
      <label htmlFor="codigo-manual" className="text-texto-suave">
        {t.numeroCodigo}
      </label>
      <div className="flex gap-2">
        <input
          id="codigo-manual"
          name="q"
          inputMode="numeric"
          autoComplete="off"
          pattern="[0-9 ]*"
          className="min-h-11 flex-1 rounded-full border border-dorado bg-superficie px-4 text-base text-texto focus:outline-2 focus:outline-dorado"
        />
        <button type="submit" className="min-h-11 rounded-full bg-boton px-5 font-semibold text-boton-texto">
          {t.buscar}
        </button>
      </div>
    </form>
  );
}

export default function PaginaEscanear() {
  return (
    <>
      <Encabezado />
      <main className="mx-auto max-w-xl px-4 pb-10">
        <Volver />
        <h1 className="mt-2 font-titulos text-2xl text-titulo">{t.titulo}</h1>
        <p className="mt-1 text-texto-suave">{t.ayuda}</p>
        <EscanerDiferido />
        <IngresoManual />
      </main>
    </>
  );
}
