import { ESTADOS, type Filtros } from "@/lib/admin/productos";
import { textos } from "@/lib/textos";

const control =
  "min-h-11 rounded-md border border-dorado/60 bg-superficie px-3 text-base text-texto focus:outline-2 focus:outline-dorado";

/** Búsqueda y filtros. Es un formulario GET: los filtros quedan en la dirección. */
export function FiltrosProductos({
  filtros,
  secciones,
}: {
  filtros: Filtros;
  secciones: { id: string; nombre: string }[];
}) {
  return (
    <form method="get" action="/admin" role="search" className="flex flex-wrap items-end gap-3">
      <label className="flex min-w-64 flex-1 flex-col gap-1">
        <span className="text-sm text-texto-suave">{textos.admin.buscarProductos}</span>
        <input
          type="search"
          name="q"
          defaultValue={filtros.q}
          aria-label={textos.admin.buscarProductos}
          placeholder={textos.admin.buscarProductosAyuda}
          autoFocus
          autoComplete="off"
          className={control}
        />
      </label>
      <div className="flex flex-col gap-1">
        <label htmlFor="filtro-seccion" className="text-sm text-texto-suave">{textos.admin.seccion}</label>
        <select id="filtro-seccion" name="seccion" defaultValue={filtros.seccion} className={control}>
          <option value="">{textos.admin.todasLasSecciones}</option>
          {secciones.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="filtro-estado" className="text-sm text-texto-suave">{textos.admin.estado}</label>
        <select id="filtro-estado" name="estado" defaultValue={filtros.estado} className={control}>
          <option value="">{textos.admin.todos}</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {textos.admin.estados[e]}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="min-h-11 rounded-md bg-boton px-5 font-semibold text-boton-texto">
        {textos.admin.filtrar}
      </button>
    </form>
  );
}
