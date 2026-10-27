import Link from "next/link";
import { textos } from "@/lib/textos";

export function Volver() {
  return (
    <Link href="/" className="inline-flex min-h-11 items-center text-dorado before:content-['‹'] before:mr-1">
      {textos.volverACarta}
    </Link>
  );
}
