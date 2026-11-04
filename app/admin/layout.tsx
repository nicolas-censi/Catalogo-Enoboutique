import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { MenuPanel } from "@/components/admin/MarcoPanel";
import { Cargando } from "@/components/admin/ui/Cargando";

export const metadata: Metadata = {
  title: "Panel · Lehonor Enoboutique",
  robots: { index: false, follow: false },
};

/**
 * Spec 015, CA-1: el marco del panel vive acá: el fondo del panel está desde el primer
 * momento (nunca el negro de la carta) y el menú no se vuelve a armar al navegar.
 */
export default function LayoutAdmin({ children }: { children: ReactNode }) {
  return (
    <div className="tema-panel min-h-dvh md:flex">
      <Suspense fallback={null}>
        <MenuPanel />
      </Suspense>
      <main className="mx-auto w-full max-w-6xl min-w-0 flex-1 px-4 pt-6 pb-28 md:px-10 md:pt-10 md:pb-12">
        <Suspense fallback={<Cargando />}>{children}</Suspense>
      </main>
    </div>
  );
}
