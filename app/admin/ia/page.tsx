import { Suspense } from "react";
import { ConSesion } from "@/components/admin/ConSesion";
import { InterruptorIa } from "@/components/admin/InterruptorIa";
import { usuarios } from "@/lib/admin/personal-servidor";
import { crearClienteServidor } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

const t = textos.admin.ia;
const fecha = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" });

async function Ajustes() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("ajustes_ia").select("activa, cambiada_por, cambiada_en").eq("id", 1).maybeSingle();
  // Solo el encargado llega acá (ConSesion soloEncargado).
  const quien = data?.cambiada_por ? ((await usuarios([data.cambiada_por])).get(data.cambiada_por) ?? null) : null;
  return (
    <div className="flex flex-col gap-3">
      <InterruptorIa activa={data?.activa === true} />
      {data?.cambiada_en && quien && <p className="text-sm text-texto-suave">{t.cambiada(quien, fecha.format(new Date(data.cambiada_en)))}</p>}
    </div>
  );
}

export default function PaginaIa() {
  return (
    <Suspense fallback={null}>
      <ConSesion soloEncargado>
        {() => (
          <>
            <h1 className="font-titulos text-2xl text-titulo">{t.titulo}</h1>
            <p className="mt-2 mb-6 max-w-prose text-texto-suave">{t.ayuda}</p>
            <Ajustes />
          </>
        )}
      </ConSesion>
    </Suspense>
  );
}
