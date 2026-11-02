-- 013 / T5: promociones del inicio. Solo una imagen, en el orden que elige el encargado;
-- el público ve las visibles. Imágenes en el bucket público "promociones".

create table public.promociones (
  id uuid primary key default gen_random_uuid(),
  imagen_path text not null check (btrim(imagen_path) <> ''),
  orden integer not null,
  visible boolean not null default true,
  creado_en timestamptz not null default now()
);

create index promociones_orden_idx on public.promociones (orden);

alter table public.promociones enable row level security;
grant select on public.promociones to anon, authenticated;
grant update (visible), delete on public.promociones to authenticated;
grant select, insert, update, delete on public.promociones to service_role;
create policy "el público ve las promociones visibles" on public.promociones for select to anon
  using (visible);
create policy "el personal ve las promociones" on public.promociones for select to authenticated
  using (visible or (select public.es_encargado()));
create policy "encargado cambia promociones" on public.promociones for update to authenticated
  using ((select public.es_encargado())) with check ((select public.es_encargado()));
create policy "encargado borra promociones" on public.promociones for delete to authenticated
  using ((select public.es_encargado()));

-- Crea la promoción al final.
create function public.crear_promocion(imagen text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  nueva uuid;
begin
  if not public.es_encargado() then
    raise exception 'Solo el encargado puede cargar promociones.' using errcode = 'insufficient_privilege';
  end if;
  insert into public.promociones (imagen_path, orden)
  values (imagen, coalesce((select max(orden) from public.promociones), 0) + 1)
  returning id into nueva;
  return nueva;
end;
$$;

-- Las promociones de `ids` toman las posiciones 1..n; las que no vinieron, después.
create function public.ordenar_promociones(ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.es_encargado() then
    raise exception 'Solo el encargado puede ordenar las promociones.' using errcode = 'insufficient_privilege';
  end if;
  with nuevo as (
    select p.id, row_number() over (order by array_position(ids, p.id) nulls last, p.orden, p.id) as posicion
    from public.promociones p
  )
  update public.promociones p set orden = nuevo.posicion
  from nuevo where nuevo.id = p.id and p.orden is distinct from nuevo.posicion;
end;
$$;

revoke execute on function public.crear_promocion(text) from public, anon;
revoke execute on function public.ordenar_promociones(uuid[]) from public, anon;
grant execute on function public.crear_promocion(text) to authenticated;
grant execute on function public.ordenar_promociones(uuid[]) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('promociones', 'promociones', true, 5 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "encargado ve imágenes de promociones" on storage.objects for select to authenticated
  using (bucket_id = 'promociones' and (select public.es_encargado()));
create policy "encargado sube imágenes de promociones" on storage.objects for insert to authenticated
  with check (bucket_id = 'promociones' and (select public.es_encargado()));
create policy "encargado borra imágenes de promociones" on storage.objects for delete to authenticated
  using (bucket_id = 'promociones' and (select public.es_encargado()));
