"use client";

import dynamic from "next/dynamic";

/** El escáner y su lector se descargan recién en /escanear (spec 003, CA-6). */
export const EscanerDiferido = dynamic(() => import("@/components/Escaner").then((m) => m.Escaner), { ssr: false });
