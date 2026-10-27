import Image from "next/image";
import Link from "next/link";
import logo from "@/public/logo-enoboutique.png";
import { textos } from "@/lib/textos";

export function Encabezado() {
  return (
    <header className="flex justify-center px-4 pt-6 pb-4">
      <Link href="/" className="inline-block min-h-11">
        <Image src={logo} alt={textos.nombreCarta} priority className="h-14 w-auto" />
      </Link>
    </header>
  );
}
