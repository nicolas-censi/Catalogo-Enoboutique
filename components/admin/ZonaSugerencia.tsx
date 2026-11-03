"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

// Mantiene el aviso ("Listo. Ya se ve en la carta.") aunque, al aprobar o descartar, la
// ficha se vuelva a cargar y la sugerencia deje lugar al botón Sugerir con IA.
const Aviso = createContext<(texto: string | null) => void>(() => {});

export const useAvisoSugerencia = () => useContext(Aviso);

export function ZonaSugerencia({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<string | null>(null);
  return (
    <Aviso.Provider value={setAviso}>
      <div className="flex flex-col gap-3">
        {aviso && <p role="status">{aviso}</p>}
        {children}
      </div>
    </Aviso.Provider>
  );
}
