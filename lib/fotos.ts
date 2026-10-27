// Fotos de productos en Supabase Storage. El bucket público "fotos" se crea en la
// spec 4 (panel), junto con la subida de fotos.
const BUCKET = "fotos";

export function urlFoto(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}
