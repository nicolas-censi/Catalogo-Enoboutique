"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { procesarTandaCola } from "@/app/admin/acciones-sugerencias";
import { textos } from "@/lib/textos";

const t = textos.admin.paraRevisar;

type Estado = { tipo: "buscando"; quedan: number } | { tipo: "apagada"; quedan: number } | { tipo: "tope" } | { tipo: "error" } | { tipo: "listo" };

/**
 * Spec 007, CA-3: mientras la bandeja está abierta, procesa la cola de a tandas y va
 * mostrando las sugerencias que llegan. Sin cron, la cola avanza solo así.
 */
export function ProcesadorCola({ enCola, iaActiva }: { enCola: number; iaActiva: boolean }) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>(
    enCola === 0 ? { tipo: "listo" } : iaActiva ? { tipo: "buscando", quedan: enCola } : { tipo: "apagada", quedan: enCola },
  );
  const activo = estado.tipo === "buscando";

  useEffect(() => {
    if (!activo) return;
    let cancelado = false;
    (async () => {
      while (!cancelado) {
        const r = await procesarTandaCola();
        if (cancelado) return;
        if ("error" in r) return setEstado({ tipo: "error" });
        if (r.listas || r.fallidas) router.refresh();
        if (r.apagada) return setEstado({ tipo: "apagada", quedan: r.quedan });
        if (r.topeAlcanzado) return setEstado({ tipo: "tope" });
        if (r.quedan === 0) return setEstado({ tipo: "listo" });
        setEstado({ tipo: "buscando", quedan: r.quedan });
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [activo, router]);

  if (estado.tipo === "listo") return null;
  const texto =
    estado.tipo === "buscando" ? t.buscando(estado.quedan) : estado.tipo === "apagada" ? t.colaApagada(estado.quedan) : estado.tipo === "tope" ? t.tope : t.error;
  return (
    <p role="status" className="rounded-md border border-dorado/40 px-4 py-3">
      {texto}
    </p>
  );
}
