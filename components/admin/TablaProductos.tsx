"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { moverProductos } from "@/app/admin/acciones-mover";
import { PedirSugerencias } from "@/components/admin/PedirSugerencias";
import { claseBoton } from "@/components/admin/ui/boton";
import { Dialogo } from "@/components/admin/ui/Dialogo";
import type { Filtros, ProductoAdmin, SeccionConSubsecciones } from "@/lib/admin/productos";
import { nombreConSeccion } from "@/lib/admin/secciones";
import { formatearPrecio } from "@/lib/formato";
import { urlFoto } from "@/lib/fotos";
import { textos } from "@/lib/textos";

const m = textos.admin.mover;
const l = textos.admin.lista;
const control = "min-h-11 w-full rounded-lg border border-control bg-superficie px-3 text-base text-texto focus:outline-2 focus:outline-texto";

/** Solo los estados que piden atención (spec 014, CA-4). */
function avisos(p: ProductoAdmin): string[] {
  return [
    p.sugerencia_lista ? l.sugerencia : null,
    !p.visible ? textos.admin.oculto : null,
    p.anadas_en_stock === 0 ? textos.admin.sinStock : null,
    !p.foto_path ? textos.admin.sinFoto : null,
    (p.anadas_a_revisar ?? 0) > 0 ? textos.admin.aRevisar(p.anadas_a_revisar!) : null,
  ].filter((a): a is string => a !== null);
}

function precio(p: ProductoAdmin): string | null {
  if (p.precio_desde === null) return null;
  const desde = formatearPrecio(p.precio_desde);
  return p.precio_hasta !== null && p.precio_hasta !== p.precio_desde ? l.desde(desde) : desde;
}

function seccion(p: ProductoAdmin): string {
  if (!p.seccion_nombre) return textos.admin.sinSeccion;
  return p.seccion_padre_nombre ? nombreConSeccion(p.seccion_padre_nombre, p.seccion_nombre) : p.seccion_nombre;
}

/**
 * Lista de productos del panel (spec 014, CA-4 y CA-5): filas compactas; con "Elegir
 * varios" aparecen las casillas y una barra abajo para mover o pedir sugerencias.
 */
export function TablaProductos({
  productos,
  total,
  filtros,
  secciones,
  iaActiva = false,
}: {
  iaActiva?: boolean;
  productos: ProductoAdmin[];
  total: number;
  filtros: Filtros;
  secciones: SeccionConSubsecciones[];
}) {
  const [eligiendo, setEligiendo] = useState(false);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  // "Todos los del filtro": también los de las otras páginas.
  const [todoElFiltro, setTodoElFiltro] = useState(false);
  const [dialogo, setDialogo] = useState<"mover" | "sugerir" | null>(null);
  const [destino, setDestino] = useState("");
  const [mensaje, setMensaje] = useState<{ error: string | null; aviso: string | null }>({ error: null, aviso: null });
  const [moviendo, iniciar] = useTransition();

  if (productos.length === 0) {
    return <p className="py-8 text-center text-texto-suave">{textos.admin.sinResultados}</p>;
  }
  const cantidad = todoElFiltro ? total : seleccion.size;
  const elegida = (id: string) => todoElFiltro || seleccion.has(id);
  const vaciar = () => {
    setSeleccion(new Set());
    setTodoElFiltro(false);
  };
  const alternar = (id: string, marcar: boolean) => {
    setTodoElFiltro(false);
    setSeleccion((anterior) => {
      const nueva = new Set(todoElFiltro ? productos.map((p) => p.id!) : anterior);
      if (marcar) nueva.add(id);
      else nueva.delete(id);
      return nueva;
    });
  };
  const elegidos = todoElFiltro ? { filtros } : { ids: [...seleccion] };

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-texto-suave">{l.cantidad(total)}</p>
        {eligiendo ? (
          <button
            type="button"
            onClick={() => {
              setEligiendo(false);
              vaciar();
            }}
            className={claseBoton("texto")}
          >
            {l.listo}
          </button>
        ) : (
          <button type="button" onClick={() => setEligiendo(true)} className={claseBoton("secundario")}>
            {l.elegirVarios}
          </button>
        )}
      </div>
      {mensaje.aviso && (
        <p role="status" className="mb-3 rounded-lg border border-linea bg-superficie px-4 py-3">
          {mensaje.aviso}
        </p>
      )}
      {mensaje.error && (
        <p role="alert" className="mb-3 text-error">
          {mensaje.error}
        </p>
      )}

      <ul aria-label={l.titulo} className="divide-y divide-linea rounded-xl border border-linea bg-superficie">
        {productos.map((p) => {
          const lista = avisos(p);
          const monto = precio(p);
          return (
            <li key={p.id} className="flex min-h-16 items-center gap-3 px-3 py-2 md:px-4">
              {eligiendo && (
                <input
                  type="checkbox"
                  aria-label={m.elegir(p.nombre ?? "")}
                  checked={elegida(p.id!)}
                  onChange={(e) => alternar(p.id!, e.target.checked)}
                  className="size-5 shrink-0 accent-texto"
                />
              )}
              {p.foto_path ? (
                <Image src={urlFoto(p.foto_path)} alt="" width={36} height={48} className="h-12 w-9 shrink-0 rounded bg-fondo object-contain" />
              ) : (
                <span aria-hidden="true" className="h-12 w-9 shrink-0 rounded bg-fondo" />
              )}
              <Link href={filtros.codigo ? `/admin/productos/${p.id}?pestana=codigos&codigo=${filtros.codigo}` : `/admin/productos/${p.id}`} className="group flex min-h-11 min-w-0 flex-1 flex-col justify-center">
                <span className="block truncate font-semibold group-hover:underline">{p.nombre}</span>
                <span className="block truncate text-sm text-texto-suave">
                  {[p.bodega_nombre, seccion(p), l.anadas(p.cantidad_anadas ?? 0)].filter(Boolean).join(" · ")}
                  {lista.length > 0 && <span className="md:hidden">{` · ${lista.join(" · ")}`}</span>}
                </span>
              </Link>
              <div className="hidden shrink-0 items-center gap-4 text-sm text-texto-suave md:flex">
                {lista.map((a) => (
                  <span key={a} className={a === l.sugerencia ? "text-dorado-texto" : undefined}>
                    {a}
                  </span>
                ))}
              </div>
              {monto && <span className="shrink-0 text-sm text-texto">{monto}</span>}
            </li>
          );
        })}
      </ul>

      {eligiendo && (
        <div
          role="region"
          aria-label={l.acciones}
          className="fixed inset-x-3 bottom-[4.5rem] z-20 flex flex-wrap items-center gap-2 rounded-xl bg-boton p-3 text-boton-texto shadow-lg md:sticky md:inset-x-auto md:bottom-4 md:mt-4"
        >
          <span className="mr-auto px-1">{l.elegidos(cantidad)}</span>
          {!todoElFiltro && total > seleccion.size && (
            <button type="button" onClick={() => setTodoElFiltro(true)} className="inline-flex min-h-11 items-center rounded-lg border border-boton-texto/40 px-3">
              {l.elegirFiltro(total)}
            </button>
          )}
          <button
            type="button"
            disabled={cantidad === 0}
            onClick={() => setDialogo("mover")}
            className="inline-flex min-h-11 items-center rounded-lg border border-boton-texto/40 px-3 disabled:opacity-50"
          >
            {l.mover}
          </button>
          {iaActiva && (
            <button
              type="button"
              disabled={cantidad === 0}
              onClick={() => setDialogo("sugerir")}
              className="inline-flex min-h-11 items-center rounded-lg border border-boton-texto/40 px-3 disabled:opacity-50"
            >
              {l.sugerirTitulo}
            </button>
          )}
        </div>
      )}

      <Dialogo abierto={dialogo === "mover"} titulo={l.moverTitulo(cantidad)} alCerrar={() => setDialogo(null)}>
        <label htmlFor="mover-a" className="mb-1 block text-sm text-texto-suave">
          {m.seccion}
        </label>
        {/* Una sección con subsecciones no se elige: es el título del grupo (spec 011). */}
        <select id="mover-a" value={destino} onChange={(e) => setDestino(e.target.value)} className={control}>
          <option value="" />
          {secciones.map((s) =>
            s.subsecciones.length === 0 ? (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ) : (
              <optgroup key={s.id} label={s.nombre}>
                {s.subsecciones.map((h) => (
                  <option key={h.id} value={h.id}>
                    {nombreConSeccion(s.nombre, h.nombre)}
                  </option>
                ))}
              </optgroup>
            ),
          )}
        </select>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={() => setDialogo(null)} className={claseBoton("secundario")}>
            {textos.admin.ui.cancelar}
          </button>
          <button
            type="button"
            disabled={!destino || moviendo}
            onClick={() =>
              iniciar(async () => {
                const r = await moverProductos(elegidos, destino);
                setMensaje(r);
                setDialogo(null);
                if (!r.error) vaciar();
              })
            }
            className={claseBoton("principal")}
          >
            {moviendo ? m.moviendo : m.mover}
          </button>
        </div>
      </Dialogo>

      <Dialogo abierto={dialogo === "sugerir"} titulo={l.sugerirTitulo} alCerrar={() => setDialogo(null)}>
        <PedirSugerencias
          seleccion={elegidos}
          alCancelar={() => setDialogo(null)}
          alTerminar={(aviso) => {
            setDialogo(null);
            setMensaje({ error: null, aviso });
            vaciar();
          }}
        />
      </Dialogo>
    </>
  );
}
