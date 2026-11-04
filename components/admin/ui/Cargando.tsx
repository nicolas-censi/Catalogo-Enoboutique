import { textos } from "@/lib/textos";

/** Spec 015, CA-2: mientras llega el contenido. Con "reducir movimiento", sin girar. */
export function Cargando() {
  return (
    <div role="status" className="flex min-h-48 items-center justify-center gap-3 text-texto-suave">
      <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" className="animate-spin motion-reduce:animate-none">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
        <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span>{textos.admin.ui.cargando}</span>
    </div>
  );
}
