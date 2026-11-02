-- 006 / T2: marca editable desde el panel (bienvenida y logo).
--
-- Una sola fila (id = 1). La lee el público (la carta); la cambia solo el encargado.
-- El logo va al bucket público "marca" (PNG o WebP: sin SVG, que puede llevar código).

create table public.marca (
  id smallint primary key default 1 check (id = 1),
  bienvenida text check (char_length(bienvenida) <= 200),
  logo_path text,
  actualizado_en timestamptz not null default now()
);

create trigger marca_actualizado_en before update on public.marca
  for each row execute function public.set_actualizado_en();

insert into public.marca (id) values (1);

alter table public.marca enable row level security;
grant select on public.marca to anon, authenticated;
grant update (bienvenida, logo_path) on public.marca to authenticated;
grant select, insert, update, delete on public.marca to service_role;
create policy "todos ven la marca" on public.marca for select to anon, authenticated using (true);
create policy "encargado cambia la marca" on public.marca for update to authenticated
  using ((select public.es_encargado())) with check ((select public.es_encargado()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('marca', 'marca', true, 2 * 1024 * 1024, array['image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "encargado ve logos" on storage.objects for select to authenticated
  using (bucket_id = 'marca' and (select public.es_encargado()));
create policy "encargado sube logos" on storage.objects for insert to authenticated
  with check (bucket_id = 'marca' and (select public.es_encargado()));
create policy "encargado borra logos" on storage.objects for delete to authenticated
  using (bucket_id = 'marca' and (select public.es_encargado()));
