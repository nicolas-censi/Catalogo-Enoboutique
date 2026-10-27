import type { Metadata } from "next";
import { Cabin, Inknut_Antiqua } from "next/font/google";
import { textos } from "@/lib/textos";
import "./globals.css";

const inknutAntiqua = Inknut_Antiqua({
  variable: "--font-inknut-antiqua",
  weight: ["400", "600"],
  subsets: ["latin"],
});

const cabin = Cabin({
  variable: "--font-cabin",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: textos.nombreCarta,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR" className={`${inknutAntiqua.variable} ${cabin.variable}`}>
      <body>{children}</body>
    </html>
  );
}
