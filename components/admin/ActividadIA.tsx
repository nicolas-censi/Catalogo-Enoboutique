"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { textos } from "@/lib/textos";

const t = textos.admin.avisos;

type Nueva = {
  id: string;
  estado: "lista" | "fallo";
  productoId: string;
  producto: string;
};
type Estado = {
  ahora: string;
  listas: number;
  enCola: number;
  procesando: number;
  iaActiva: boolean;
  nuevas: Nueva[];
};
type Aviso = { id: string; texto: string; href: string | null; error: boolean };

const RAPIDO_MS = 5_000;
const LENTO_MS = 60_000;
const CIERRE_MS = 10_000;
/** Evento que avisa que se acaba de pedir algo (consulta enseguida y más seguido). */
export const EVENTO_PEDIDA = "lehonor:sugerencia-pedida";

const Contexto = createContext<number>(0);
/** Cantidad de sugerencias listas para revisar (contador del menú). */
export const usePendientes = () => useContext(Contexto);

/**
 * Spec 015, CA-3 y CA-4: con el panel abierto, en cualquier pantalla, mueve la cola de
 * sugerencias, actualiza el contador de Para revisar y avisa cuando llega algo.
 */
export function ActividadIA({
  pendientes,
  desde,
  children,
}: {
  pendientes: number;
  desde: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [listas, setListas] = useState(pendientes);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const ultima = useRef(desde);
  const procesando = useRef(false);
  const avisadas = useRef(new Set<string>());
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);

  const quitar = useCallback(
    (id: string) => setAvisos((a) => a.filter((x) => x.id !== id)),
    [],
  );

  useEffect(() => {
    let cancelado = false;
    async function consultar(): Promise<void> {
      if (cancelado) return;
      if (espera.current) clearTimeout(espera.current);
      let siguiente = LENTO_MS;
      try {
        const r = await fetch(
          `/api/sugerencias/estado?desde=${encodeURIComponent(ultima.current)}`,
          { cache: "no-store" },
        );
        if (r.ok) {
          const e = (await r.json()) as Estado;
          ultima.current = e.ahora;
          setListas(e.listas);
          const sinAvisar = e.nuevas.filter((n) => !avisadas.current.has(n.id));
          for (const n of sinAvisar) avisadas.current.add(n.id);
          if (sinAvisar.length > 0) {
            const listasNuevas = sinAvisar.filter((n) => n.estado === "lista");
            const fallidas = sinAvisar.filter((n) => n.estado === "fallo");
            const nuevos: Aviso[] = [];
            if (listasNuevas.length === 1) {
              const n = listasNuevas[0];
              nuevos.push({
                id: n.id,
                texto: t.llego(n.producto),
                href: `/admin/productos/${n.productoId}?revisar=1`,
                error: false,
              });
            } else if (listasNuevas.length > 1) {
              nuevos.push({
                id: listasNuevas.map((n) => n.id).join(),
                texto: t.llegaron(listasNuevas.length),
                href: "/admin/sugerencias",
                error: false,
              });
            }
            for (const n of fallidas)
              nuevos.push({
                id: n.id,
                texto: t.fallo(n.producto),
                href: null,
                error: true,
              });
            setAvisos((a) => [...a, ...nuevos].slice(-3));
            for (const n of nuevos) setTimeout(() => quitar(n.id), CIERRE_MS);
            router.refresh();
          }
          const hayTrabajo = e.enCola + e.procesando > 0;
          if (hayTrabajo) siguiente = RAPIDO_MS;
          // La cola avanza con el panel abierto (de a una tanda por vez).
          if (e.iaActiva && e.enCola > 0 && !procesando.current) {
            procesando.current = true;
            fetch("/api/sugerencias/tanda", { method: "POST" })
              .then((r) => (r.ok ? (r.json() as Promise<{ listas?: number; fallidas?: number }>) : null))
              .catch(() => null)
              .then((t) => {
                procesando.current = false;
                // Si la tanda avanzó, se mira enseguida; si no (tope del día, pedidos que
                // no se pueden tomar), se espera al próximo turno: nunca en bucle.
                if (t && (t.listas ?? 0) + (t.fallidas ?? 0) > 0) void consultar();
              });
          }
        }
      } catch {
        // Sin conexión: se vuelve a intentar más tarde.
      }
      if (!cancelado)
        espera.current = setTimeout(() => void consultar(), siguiente);
    }

    espera.current = setTimeout(() => void consultar(), 1_000);
    const alPedir = () => void consultar();
    window.addEventListener(EVENTO_PEDIDA, alPedir);
    return () => {
      cancelado = true;
      window.removeEventListener(EVENTO_PEDIDA, alPedir);
      if (espera.current) clearTimeout(espera.current);
    };
  }, [quitar, router]);

  return (
    <Contexto.Provider value={listas}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-3 bottom-20 z-40 flex flex-col items-end gap-2 md:inset-x-auto md:right-6 md:bottom-6"
      >
        {avisos.map((a) => (
          <div
            key={a.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border bg-superficie px-4 py-3 shadow-lg ${a.error ? "border-error" : "border-linea border-l-4 border-l-dorado"}`}
          >
            <p className={`flex-1 ${a.error ? "text-error" : ""}`}>{a.texto}</p>
            {a.href && (
              <Link
                href={a.href}
                onClick={() => quitar(a.id)}
                className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
              >
                {t.revisar}
              </Link>
            )}
            <button
              type="button"
              onClick={() => quitar(a.id)}
              aria-label={t.cerrar}
              className="inline-flex size-11 items-center justify-center rounded-lg text-texto-suave"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </Contexto.Provider>
  );
}
