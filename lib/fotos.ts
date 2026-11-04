// Fotos de productos en Supabase Storage. El bucket público "fotos" se crea en la
// spec 4 (panel), junto con la subida de fotos.
const BUCKET = "fotos";

export function urlFoto(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

/** Logo que el encargado subió desde el panel (bucket público "marca", spec 006). */
export function urlLogo(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/marca/${path}`;
}

/** Imagen de una promoción del inicio (bucket público "promociones", spec 013). */
export function urlPromocion(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/promociones/${path}`;
}
