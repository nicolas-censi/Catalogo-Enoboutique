"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { borrarPromocion, cambiarVisibilidadPromocion, crearPromociones, ordenarPromociones } from "@/app/admin/acciones-promociones";
import { ManijaOrdenable, Ordenable, useElementoOrdenable } from "@/components/admin/Ordenable";
import { reducirFoto } from "@/lib/admin/fotos";
import { rutaPromocion, validarArchivoPromocion } from "@/lib/admin/promociones";
import { urlPromocion } from "@/lib/fotos";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { textos } from "@/lib/textos";

const t = textos.admin.promociones;
const principal = "inline-flex min-h-11 cursor-pointer items-center rounded-md bg-boton px-5 font-semibold text-boton-texto";
const secundario = "inline-flex min-h-11 items-center rounded-md border border-control px-4 disabled:opacity-60";

export type PromocionAdmin = { id: string; imagenPath: string; visible: boolean };
type Mensaje = { error: string | null; aviso: string | null };

function FilaPromocion({ promocion, nombre }: { promocion: PromocionAdmin; nombre: string }) {
  const { ref, estilo, arrastrando, manija } = useElementoOrdenable(promocion.id, nombre);
  const [visible, setVisible] = useState(promocion.visible);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();
  return (
    <li ref={ref} style={estilo} className={`flex flex-wrap items-center gap-3 py-3 ${arrastrando ? "bg-superficie shadow-lg" : ""}`}>
      <ManijaOrdenable manija={manija} />
      <Image src={urlPromocion(promocion.imagenPath)} alt={nombre} width={160} height={90} className="h-[90px] w-40 rounded-md bg-superficie object-cover" />
      <span className="min-w-28 flex-1">{nombre}</span>
      <button
        type="button"
        role="switch"
        aria-checked={visible}
        aria-label={t.enCarta(nombre)}
        disabled={ocupado}
        onClick={() =>
          iniciar(async () => {
            const nuevo = !visible;
            const r = await cambiarVisibilidadPromocion(promocion.id, nuevo);
            setError(r.error);
            if (!r.error) setVisible(nuevo);
          })
        }
        className={`inline-flex min-h-11 min-w-28 items-center justify-center rounded-full border px-4 font-semibold ${
          visible ? "border-texto bg-texto text-boton-texto" : "border-control text-texto-suave"
        }`}
      >
        {visible ? t.visible : t.oculta}
      </button>
      {confirmando ? (
        <span className="flex flex-wrap items-center gap-2">
          <span>{t.confirmar}</span>
          <button
            type="button"
            disabled={ocupado}
            className={principal}
            onClick={() =>
              iniciar(async () => {
                const r = await borrarPromocion(promocion.id);
                setError(r.error);
                if (r.error) setConfirmando(false);
              })
            }
          >
            {t.siBorrar}
          </button>
          <button type="button" onClick={() => setConfirmando(false)} className={secundario}>
            {t.cancelar}
          </button>
        </span>
      ) : (
        <button type="button" aria-label={t.borrar(nombre)} onClick={() => setConfirmando(true)} className={secundario}>
          {t.borrarCorto}
        </button>
      )}
      {error && (
        <span role="alert" className="basis-full text-sm text-error">
          {error}
        </span>
      )}
    </li>
  );
}

export function EditorPromociones({ promociones }: { promociones: PromocionAdmin[] }) {
  const [mensaje, setMensaje] = useState<Mensaje>({ error: null, aviso: null });
  const [subiendo, iniciar] = useTransition();
  // Cada promoción se nombra por su lugar: "Promoción 1", "Promoción 2"…
  const items = promociones.map((p, i) => ({ ...p, nombre: t.nombre(i + 1) }));

  function alElegir(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivos = [...(evento.target.files ?? [])];
    evento.target.value = "";
    if (archivos.length === 0) return;
    const invalido = archivos.map(validarArchivoPromocion).find(Boolean);
    if (invalido) return setMensaje({ error: invalido, aviso: null });
    iniciar(async () => {
      const rutas: string[] = [];
      for (const archivo of archivos) {
        const { datos, tipo, extension } = await reducirFoto(archivo);
        const ruta = rutaPromocion(extension);
        const subida = await crearClienteNavegador().storage.from("promociones").upload(ruta, datos, { contentType: tipo });
        if (subida.error) return setMensaje({ error: textos.admin.errorGuardar, aviso: null });
        rutas.push(ruta);
      }
      setMensaje(await crearPromociones(rutas));
    });
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <label className={`${principal} w-fit`}>
          {subiendo ? t.subiendo : t.subir}
          <input
            type="file"
            multiple
            // Tipos explícitos (sin image/* ni capture): ofrece archivos, no la cámara.
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            aria-label={t.subir}
            disabled={subiendo}
            onChange={alElegir}
            className="sr-only"
          />
        </label>
        <p className="text-sm text-texto-suave">{t.formatos}</p>
        {mensaje.aviso && <p role="status">{mensaje.aviso}</p>}
        {mensaje.error && (
          <p role="alert" className="text-error">
            {mensaje.error}
          </p>
        )}
      </div>
      <div className="mt-6">
        {items.length === 0 ? (
          <p>{t.vacia}</p>
        ) : (
          <Ordenable items={items} onCambio={ordenarPromociones}>
            {(ordenadas) => (
              <ul aria-label={t.lista} className="divide-y divide-linea">
                {ordenadas.map((p) => (
                  <FilaPromocion key={p.id} promocion={p} nombre={p.nombre} />
                ))}
              </ul>
            )}
          </Ordenable>
        )}
      </div>
    </>
  );
}
