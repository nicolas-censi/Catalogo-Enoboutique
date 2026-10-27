import { FormularioPedirEnlace } from "@/components/admin/FormulariosContrasena";
import { textos } from "@/lib/textos";

export default function PaginaOlvide() {
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-titulos text-2xl text-titulo">{textos.admin.recuperarTitulo}</h1>
      <p className="mt-2 text-texto-suave">{textos.admin.recuperarAyuda}</p>
      <FormularioPedirEnlace />
    </main>
  );
}
