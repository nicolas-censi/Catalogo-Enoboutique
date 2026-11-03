"use client";

import { useState, useTransition } from "react";
import { borrarProducto } from "@/app/admin/acciones-producto";
import { Confirmar } from "@/components/admin/ui/Confirmar";
import { MenuAcciones } from "@/components/admin/ui/MenuAcciones";
import { textos } from "@/lib/textos";

const t = textos.admin;

/** Spec 014, CA-6: menú ⋯ de la ficha (Borrar producto, con confirmación). */
export function AccionesFicha({ productoId, nombre, anadas }: { productoId: string; nombre: string; anadas: number }) {
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [borrando, iniciar] = useTransition();
  return (
    <>
      <MenuAcciones etiqueta={t.ui.masAcciones(nombre)} acciones={[{ etiqueta: t.borrarProducto, peligro: true, alElegir: () => setConfirmando(true) }]} />
      <Confirmar
        abierto={confirmando}
        titulo={t.borrarProducto}
        detalle={t.confirmarBorrarProducto(nombre, anadas)}
        confirmar={t.siBorrar}
        ocupado={borrando}
        error={error}
        alCancelar={() => {
          setConfirmando(false);
          setError(null);
        }}
        alConfirmar={() => iniciar(async () => setError((await borrarProducto(productoId)).error))}
      />
    </>
  );
}
