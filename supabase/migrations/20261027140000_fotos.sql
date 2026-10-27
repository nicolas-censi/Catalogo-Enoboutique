-- 004 / T11: bucket público "fotos" para las fotos de los productos.
--
-- Lectura pública (la carta muestra las fotos por su dirección pública).
-- Subir, reemplazar y borrar: solo el personal.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fotos',
  'fotos',
  true,
  10 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "personal ve fotos" on storage.objects for select to authenticated
  using (bucket_id = 'fotos' and (select public.es_personal()));

create policy "personal sube fotos" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (select public.es_personal()));

create policy "personal reemplaza fotos" on storage.objects for update to authenticated
  using (bucket_id = 'fotos' and (select public.es_personal()))
  with check (bucket_id = 'fotos' and (select public.es_personal()));

create policy "personal borra fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and (select public.es_personal()));
