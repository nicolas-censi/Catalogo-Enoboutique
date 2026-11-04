"use client";

import { useEffect, useId, useRef, useState } from "react";

export type Accion = { etiqueta: string; alElegir: () => void; peligro?: boolean };

/**
 * Spec 014, CA-3 y CA-7: menú ⋯ con las acciones de una fila o de la ficha. Se abre con
 * clic, Enter o Espacio; flechas para moverse; Escape o clic afuera lo cierran y el foco
 * vuelve al botón.
 */
export function MenuAcciones({ etiqueta, acciones }: { etiqueta: string; acciones: Accion[] }) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!abierto) return;
    menu.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const afuera = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node) && !boton.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("pointerdown", afuera);
    return () => document.removeEventListener("pointerdown", afuera);
  }, [abierto]);

  const cerrar = () => {
    setAbierto(false);
    boton.current?.focus();
  };

  function teclas(e: React.KeyboardEvent) {
    const items = [...(menu.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
    const actual = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "Escape") {
      e.preventDefault();
      cerrar();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const siguiente = (actual + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length;
      items[siguiente]?.focus();
    } else if (e.key === "Tab") {
      setAbierto(false);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        ref={boton}
        type="button"
        aria-label={etiqueta}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={abierto ? id : undefined}
        onClick={() => setAbierto((a) => !a)}
        className="inline-flex size-11 items-center justify-center rounded-lg text-texto hover:bg-superficie focus-visible:outline-2 focus-visible:outline-texto"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {abierto && (
        <ul
          ref={menu}
          id={id}
          role="menu"
          aria-label={etiqueta}
          onKeyDown={teclas}
          className="absolute right-0 z-30 mt-1 min-w-52 rounded-lg border border-linea bg-superficie py-1 shadow-lg"
        >
          {acciones.map((a) => (
            <li key={a.etiqueta} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setAbierto(false);
                  a.alElegir();
                }}
                className={`flex min-h-11 w-full items-center px-4 text-left hover:bg-fondo focus:bg-fondo focus:outline-none ${a.peligro ? "text-error" : "text-texto"}`}
              >
                {a.etiqueta}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
