import type { NextConfig } from "next";

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // En entornos con proxy de red (como el de Claude Code en la nube) el optimizador de
    // imágenes no puede descargar las fotos: ahí se sirven tal cual. En Vercel, optimizadas.
    unoptimized: process.env.IMAGENES_SIN_OPTIMIZAR === "1",
    // Fotos de productos servidas desde Supabase Storage.
    remotePatterns: supabase
      ? [{ protocol: "https", hostname: supabase.hostname, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
