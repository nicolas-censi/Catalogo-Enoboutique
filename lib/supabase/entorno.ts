/** Variables públicas de Supabase, con un error claro si faltan (ej.: en Vercel). */
export function entornoSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const faltan = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !clave && "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ].filter(Boolean);
  if (faltan.length > 0) {
    throw new Error(
      `Faltan variables de entorno de Supabase: ${faltan.join(", ")}. ` +
        "Cargalas en .env.local o, en Vercel, en Settings → Environment Variables " +
        "(marcando Production y Preview).",
    );
  }
  return { url: url!, clave: clave! };
}
