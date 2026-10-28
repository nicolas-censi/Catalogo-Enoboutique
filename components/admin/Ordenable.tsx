"use client";

// Listas que se ordenan arrastrando (spec 005): con el mouse, con el dedo desde la
// manija o con el teclado (Espacio, flechas, Espacio). Al soltar se guarda solo; si no
// se pudo, la lista vuelve al orden anterior y se avisa.
import {
  closestCorners,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useId, useState, useTransition, type CSSProperties, type ReactNode } from "react";
import { textos } from "@/lib/textos";

const t = textos.admin.orden;

type Item = { id: string; nombre: string };
type Manija = ReturnType<typeof useSortable>;

export function Ordenable<T extends Item>({
  items,
  onCambio,
  children,
}: {
  items: T[];
  /** Guarda el nuevo orden; devuelve el error a mostrar, o null. */
  onCambio: (ids: string[]) => Promise<{ error: string | null }>;
  /** Dibuja la lista en el orden actual (filas de una tabla, elementos de una lista…). */
  children: (items: T[]) => ReactNode;
}) {
  const clave = items.map((i) => i.id).join();
  const [base, setBase] = useState(clave);
  // Se guarda solo el orden de los ids; los datos de cada elemento (nombre, visible…)
  // siempre son los últimos que mandó el servidor.
  const [ids, setIds] = useState(() => items.map((i) => i.id));
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [, iniciar] = useTransition();
  const instrucciones = useId();

  // Si el servidor manda otra lista (por ejemplo, después de guardar o de crear una
  // sección), se toma su orden.
  if (clave !== base) {
    setBase(clave);
    setIds(items.map((i) => i.id));
  }
  const porId = new Map(items.map((i) => [i.id, i]));
  const orden = ids.flatMap((id) => porId.get(id) ?? []);

  const sensores = useSensors(
    // Con el mouse o el dedo hay que mover unos px antes de que empiece a arrastrar.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const nombre = (id: UniqueIdentifier) => orden.find((i) => i.id === id)?.nombre ?? "";
  const posicion = (id: UniqueIdentifier | undefined) => orden.findIndex((i) => i.id === id) + 1;
  const anuncios: Announcements = {
    onDragStart: ({ active }) => t.tomado(nombre(active.id), posicion(active.id), orden.length),
    onDragOver: ({ active, over }) => (over ? t.posicion(nombre(active.id), posicion(over.id), orden.length) : undefined),
    onDragEnd: ({ active, over }) => (over ? t.soltado(nombre(active.id), posicion(over.id), orden.length) : undefined),
    onDragCancel: ({ active }) => t.cancelado(nombre(active.id), posicion(active.id)),
  };

  function alSoltar({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const anterior = ids;
    const nuevo = arrayMove(orden, posicion(active.id) - 1, posicion(over.id) - 1).map((i) => i.id);
    setIds(nuevo);
    setAviso(null);
    iniciar(async () => {
      let error: string | null;
      try {
        error = (await onCambio(nuevo)).error;
      } catch {
        error = t.errorGuardar;
      }
      if (error) {
        setIds(anterior);
        setAviso({ tipo: "error", texto: error });
      } else {
        setAviso({ tipo: "ok", texto: t.guardado });
      }
    });
  }

  return (
    <>
      <DndContext
        sensors={sensores}
        collisionDetection={closestCorners}
        onDragEnd={alSoltar}
        accessibility={{ announcements: anuncios, screenReaderInstructions: { draggable: t.instrucciones }}}
        id={instrucciones}
      >
        <SortableContext items={orden.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {children(orden)}
        </SortableContext>
      </DndContext>
      <p role="status" className="mt-2 min-h-6 text-sm text-texto-suave">
        {aviso?.tipo === "ok" ? aviso.texto : ""}
      </p>
      {aviso?.tipo === "error" && (
        <p role="alert" className="text-sm text-destacado">
          {aviso.texto}
        </p>
      )}
    </>
  );
}

/** Lo que necesita cada elemento de la lista: ref y estilo para moverse, y su manija. */
export function useElementoOrdenable(id: string, nombre: string) {
  const sortable = useSortable({ id });
  const estilo: CSSProperties = {
    transform: CSS.Translate.toString(sortable.transform),
    transition: sortable.transition,
    position: "relative",
    zIndex: sortable.isDragging ? 1 : undefined,
  };
  return { ref: sortable.setNodeRef, estilo, arrastrando: sortable.isDragging, manija: { nombre, sortable } };
}

/** Manija para arrastrar: botón de 44×44 px. Solo ella toma el dedo, así la página
 * sigue scrolleando al tocar el resto de la fila. */
export function ManijaOrdenable({ manija }: { manija: { nombre: string; sortable: Manija } }) {
  const { attributes, listeners, setActivatorNodeRef } = manija.sortable;
  return (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={t.mover(manija.nombre)}
      className="inline-flex min-h-11 min-w-11 cursor-grab touch-none items-center justify-center rounded-md border border-dorado/60 text-dorado active:cursor-grabbing"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <circle cx="9" cy="6" r="1.6" />
        <circle cx="15" cy="6" r="1.6" />
        <circle cx="9" cy="12" r="1.6" />
        <circle cx="15" cy="12" r="1.6" />
        <circle cx="9" cy="18" r="1.6" />
        <circle cx="15" cy="18" r="1.6" />
      </svg>
    </button>
  );
}
