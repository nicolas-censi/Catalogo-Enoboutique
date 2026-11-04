"use client";

import { claseBoton } from "@/components/admin/ui/boton";
import { textos } from "@/lib/textos";

export function BotonImprimir() {
  return (
    <button type="button" onClick={() => window.print()} className={claseBoton("principal")}>
      {textos.admin.qr.imprimir}
    </button>
  );
}
