"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useLectorCamara } from "@/components/useLectorCamara";
import { variantesCodigo } from "@/lib/escaneo";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { textos } from "@/lib/textos";

const t = textos.escaner;

type Busqueda =
  | { tipo: "buscando" }
  | { tipo: "encontrado"; nombre: string }
  | { tipo: "no-encontrado"; codigo: string };

/** Busca el código (y sus variantes) en la carta pública. */
async function buscarProducto(codigo: string) {
  const supabase = crearClienteNavegador();
  for (const variante of variantesCodigo(codigo)) {
    const { data } = await supabase.rpc("buscar_por_codigo_barras", { codigo: variante });
    if (data && data.length > 0) return { id: data[0].producto_id!, nombre: data[0].producto_nombre! };
  }
  return null;
}

export function Escaner() {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState<Busqueda | null>(null);

  const alLeer = useCallback(
    async (codigo: string) => {
      setBusqueda({ tipo: "buscando" });
      const producto = await buscarProducto(codigo);
      if (producto) {
        setBusqueda({ tipo: "encontrado", nombre: producto.nombre });
        router.replace(`/producto/${producto.id}`);
      } else {
        setBusqueda({ tipo: "no-encontrado", codigo });
      }
    },
    [router],
  );
  const { video, estado, reintentar, apagar } = useLectorCamara(alLeer);

  const mostrarVideo = estado.tipo === "iniciando" || estado.tipo === "escaneando";
  const noEncontrado = estado.tipo === "leido" && busqueda?.tipo === "no-encontrado" ? busqueda : null;
  const mensaje =
    estado.tipo === "iniciando" ? t.iniciando
    : estado.tipo === "escaneando" ? t.apuntando
    : estado.tipo === "error" ? estado.mensaje
    : busqueda?.tipo === "encontrado" ? t.encontrado(busqueda.nombre)
    : busqueda?.tipo === "no-encontrado" ? t.noEncontrado
    : t.buscando;

  return (
    <section className="mt-4">
      <div className={`relative overflow-hidden rounded-lg border border-dorado/40 bg-superficie ${mostrarVideo ? "" : "hidden"}`}>
        <video ref={video} aria-label={t.camara} muted playsInline className="block aspect-[3/4] w-full object-cover" />
        {/* Guía para encuadrar el código. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-[12%] top-[38%] h-[24%] rounded-md border-2 border-dorado" />
      </div>
      <p role="status" aria-live="polite" className="mt-3 text-lg">
        {mensaje}
      </p>
      {noEncontrado && <p className="text-texto-suave">{t.codigoLeido(noEncontrado.codigo)}</p>}
      {estado.tipo === "escaneando" && <p className="text-texto-suave">{t.encuadrar}</p>}
      {estado.tipo === "error" && estado.codigo && <p className="text-sm text-texto-suave">{t.codigoProblema(estado.codigo)}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {(noEncontrado || estado.tipo === "error") && (
          <button
            type="button"
            onClick={() => {
              setBusqueda(null);
              reintentar();
            }}
            className="min-h-11 rounded-full bg-boton px-5 font-semibold text-boton-texto"
          >
            {t.escanearDeNuevo}
          </button>
        )}
        {noEncontrado && (
          <Link href="/" className="inline-flex min-h-11 items-center rounded-full border border-control px-5">
            {t.buscarPorNombre}
          </Link>
        )}
        <button
          type="button"
          onClick={() => {
            apagar();
            router.push("/");
          }}
          className="min-h-11 rounded-full border border-control px-5"
        >
          {t.cerrar}
        </button>
      </div>
    </section>
  );
}
