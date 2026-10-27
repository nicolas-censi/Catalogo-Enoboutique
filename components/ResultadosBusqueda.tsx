import { TarjetaProducto } from "@/components/TarjetaProducto";
import type { Producto } from "@/lib/carta";
import { textos } from "@/lib/textos";

export function ResultadosBusqueda({ busqueda, productos }: { busqueda: string; productos: Producto[] }) {
  return (
    <section aria-label={textos.resultados} aria-live="polite" className="mt-6 flex flex-col gap-3">
      {productos.length > 0 ? (
        productos.map((producto) => <TarjetaProducto key={producto.id} producto={producto} />)
      ) : (
        <div className="py-6 text-center">
          <p className="text-lg">{textos.sinResultados(busqueda)}</p>
          <p className="mt-1 text-texto-suave">{textos.sinResultadosAyuda}</p>
        </div>
      )}
    </section>
  );
}
