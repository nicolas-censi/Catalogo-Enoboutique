"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { moverProductos } from "@/app/admin/acciones-mover";
import type { Filtros, ProductoAdmin, SeccionConSubsecciones } from "@/lib/admin/productos";
import { nombreConSeccion } from "@/lib/admin/secciones";
import { textos } from "@/lib/textos";

function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <span className="mr-1 inline-block rounded border border-dorado/60 px-2 py-0.5 text-sm text-destacado">
      {children}
    </span>
  );
}

function Estado({ producto }: { producto: ProductoAdmin }) {
  return (
    <>
      {!producto.visible && <Etiqueta>{textos.admin.oculto}</Etiqueta>}
      {producto.anadas_en_stock === 0 && <Etiqueta>{textos.admin.sinStock}</Etiqueta>}
      {!producto.foto_path && <Etiqueta>{textos.admin.sinFoto}</Etiqueta>}
      {(producto.anadas_a_revisar ?? 0) > 0 && <Etiqueta>{textos.admin.aRevisar(producto.anadas_a_revisar!)}</Etiqueta>}
    </>
  );
}

const m = textos.admin.mover;
const control =
  "min-h-11 rounded-md border border-dorado/60 bg-superficie px-3 text-base text-texto focus:outline-2 focus:outline-dorado";
const secundario = "inline-flex min-h-11 items-center rounded-md border border-dorado/60 px-4 disabled:opacity-60";
const principal = "inline-flex min-h-11 items-center rounded-md bg-boton px-5 font-semibold text-boton-texto disabled:opacity-60";

/**
 * Lista de productos del panel. Se pueden tildar (uno por uno, la página o todos los del
 * filtro) y moverlos juntos a una sección (spec 008, CA-12).
 */
export function TablaProductos({
  productos,
  total,
  filtros,
  secciones,
}: {
  productos: ProductoAdmin[];
  total: number;
  filtros: Filtros;
  secciones: SeccionConSubsecciones[];
}) {
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  // "Todos los del filtro": también los de las otras páginas.
  const [todoElFiltro, setTodoElFiltro] = useState(false);
  const [destino, setDestino] = useState("");
  const [mensaje, setMensaje] = useState<{ error: string | null; aviso: string | null }>({ error: null, aviso: null });
  const [moviendo, iniciar] = useTransition();

  if (productos.length === 0) {
    return <p className="py-8 text-center text-texto-suave">{textos.admin.sinResultados}</p>;
  }
  const c = textos.admin.columnas;
  const idsPagina = productos.map((p) => p.id!);
  const todaLaPagina = idsPagina.every((id) => todoElFiltro || seleccion.has(id));
  const cantidad = todoElFiltro ? total : seleccion.size;
  const alternar = (ids: string[], marcar: boolean) => {
    setTodoElFiltro(false);
    setSeleccion((anterior) => {
      const nueva = new Set(todoElFiltro ? idsPagina : anterior);
      ids.forEach((id) => (marcar ? nueva.add(id) : nueva.delete(id)));
      return nueva;
    });
  };

  return (
    <>
      <div className="mb-3 flex flex-wrap items-end gap-3 rounded-md border border-dorado/30 p-3">
        <span className="min-h-11 content-center">{m.seleccionados(cantidad)}</span>
        {total > 0 && !todoElFiltro && (
          <button type="button" onClick={() => setTodoElFiltro(true)} className={secundario}>
            {m.seleccionarFiltro(total)}
          </button>
        )}
        {cantidad > 0 && (
          <button
            type="button"
            onClick={() => {
              setTodoElFiltro(false);
              setSeleccion(new Set());
            }}
            className={secundario}
          >
            {m.deseleccionar}
          </button>
        )}
        <div className="flex w-full min-w-0 flex-col gap-1 sm:w-auto">
          <label htmlFor="mover-a" className="text-sm text-texto-suave">{m.seccion}</label>
          {/* Una sección con subsecciones no se elige: es el título del grupo (spec 011). */}
          <select id="mover-a" value={destino} onChange={(e) => setDestino(e.target.value)} className={`${control} w-full sm:w-auto sm:max-w-md`}>
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
        </div>
        <button
          type="button"
          disabled={cantidad === 0 || !destino || moviendo}
          onClick={() =>
            iniciar(async () => {
              const r = await moverProductos(todoElFiltro ? { filtros } : { ids: [...seleccion] }, destino);
              setMensaje(r);
              if (!r.error) {
                setSeleccion(new Set());
                setTodoElFiltro(false);
              }
            })
          }
          className={principal}
        >
          {moviendo ? m.moviendo : m.mover}
        </button>
        {mensaje.aviso && (
          <p role="status" className="basis-full">
            {mensaje.aviso}
          </p>
        )}
        {mensaje.error && (
          <p role="alert" className="basis-full text-destacado">
            {mensaje.error}
          </p>
        )}
      </div>
      <table className="tabla-responsiva w-full border-collapse text-left">
        <thead className="border-b border-dorado/40 text-sm text-texto-suave">
          <tr>
            <th scope="col" className="py-2 pr-2">
              <input
                type="checkbox"
                aria-label={m.elegirPagina}
                checked={todaLaPagina}
                onChange={(e) => alternar(idsPagina, e.target.checked)}
                className="size-5 accent-dorado"
              />
            </th>
            <th scope="col" className="py-2 pr-4">{c.producto}</th>
            <th scope="col" className="py-2 pr-4">{c.bodega}</th>
            <th scope="col" className="py-2 pr-4">{c.seccion}</th>
            <th scope="col" className="py-2 pr-4 text-right">{c.anadas}</th>
            <th scope="col" className="py-2">{c.estado}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dorado/20">
          {productos.map((p) => (
            <tr key={p.id}>
              <td className="py-1 pr-2">
                <input
                  type="checkbox"
                  aria-label={m.elegir(p.nombre ?? "")}
                  checked={todoElFiltro || seleccion.has(p.id!)}
                  onChange={(e) => alternar([p.id!], e.target.checked)}
                  className="size-5 accent-dorado"
                />
              </td>
              <td className="py-1 pr-4">
                <Link href={`/admin/productos/${p.id}`} className="inline-flex min-h-11 items-center text-destacado hover:underline">
                  {p.nombre}
                </Link>
              </td>
              <td data-etiqueta={c.bodega} className="py-1 pr-4">{p.bodega_nombre}</td>
              <td data-etiqueta={c.seccion} className="py-1 pr-4">
                {p.seccion_nombre ? (
                  p.seccion_padre_nombre ? nombreConSeccion(p.seccion_padre_nombre, p.seccion_nombre) : p.seccion_nombre
                ) : (
                  <span className="text-texto-suave">{textos.admin.sinSeccion}</span>
                )}
              </td>
              <td data-etiqueta={c.anadas} className="py-1 pr-4 tabular-nums md:text-right">{p.cantidad_anadas}</td>
              <td className="py-1"><Estado producto={p} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
