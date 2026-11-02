-- 007 / T1: sugerencias de la IA (descripción y foto) para revisar antes de publicar.
-- Las ve y las maneja todo el personal; el público no (CA-6). La carta no lee esta tabla.

create type public.estado_sugerencia as enum ('en_cola', 'procesando', 'lista', 'fallo', 'aprobada', 'descartada');

create table public.sugerencias (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos (id) on delete cascade,
  estado public.estado_sugerencia not null default 'en_cola',
  descripcion text,
  motivo_sin_descripcion text,
  foto_path text,
  foto_url_origen text,
  foto_sitio text,
  motivo_sin_foto text,
  fuentes text[] not null default '{}',
  error text,
  intentos integer not null default 0,
  tokens_entrada integer,
  tokens_salida integer,
  busquedas integer,
  costo_usd numeric(10, 5),
  pedida_por uuid default auth.uid() references auth.users (id) on delete set null,
  revisada_por uuid references auth.users (id) on delete set null,
  creado_en timestamptz not null default now(),
  tomada_en timestamptz,
  procesada_en timestamptz,
  revisada_en timestamptz
);

-- Una sola sugerencia activa por producto.
create unique index sugerencias_activa_por_producto on public.sugerencias (producto_id)
  where estado in ('en_cola', 'procesando', 'lista');
create index sugerencias_estado_idx on public.sugerencias (estado, creado_en);
create index sugerencias_procesada_idx on public.sugerencias (procesada_en);

alter table public.sugerencias enable row level security;
revoke all on public.sugerencias from anon;
grant select, insert, update on public.sugerencias to authenticated;
grant select, insert, update, delete on public.sugerencias to service_role;
create policy "el personal ve las sugerencias" on public.sugerencias for select to authenticated
  using ((select public.es_personal()));
create policy "el personal pide sugerencias" on public.sugerencias for insert to authenticated
  with check ((select public.es_personal()));
create policy "el personal revisa sugerencias" on public.sugerencias for update to authenticated
  using ((select public.es_personal())) with check ((select public.es_personal()));

-- Toma hasta `cantidad` sugerencias en cola (las más viejas), sin pasarse del tope de
-- procesadas en el día (hora de Argentina), y las marca "procesando". Antes devuelve a
-- la cola las que quedaron procesando más de 10 minutos. Dos llamadas a la vez no se
-- llevan la misma (skip locked).
create function public.tomar_cola(cantidad integer, tope_diario integer)
returns setof public.sugerencias
language plpgsql
security definer
set search_path = ''
as $$
declare
  hoy timestamptz := date_trunc('day', now() at time zone 'America/Argentina/Buenos_Aires')
    at time zone 'America/Argentina/Buenos_Aires';
  disponibles integer;
begin
  if not (public.es_personal() or (select auth.role()) = 'service_role') then
    raise exception 'Solo el personal puede procesar sugerencias.' using errcode = 'insufficient_privilege';
  end if;

  update public.sugerencias set estado = 'en_cola', tomada_en = null
  where estado = 'procesando' and tomada_en < now() - interval '10 minutes';

  select greatest(0, tope_diario - count(*))::integer into disponibles
  from public.sugerencias
  where tomada_en >= hoy or procesada_en >= hoy;

  return query
  update public.sugerencias s
  set estado = 'procesando', tomada_en = now(), intentos = s.intentos + 1
  where s.id in (
    select c.id from public.sugerencias c
    where c.estado = 'en_cola'
    order by c.creado_en, c.id
    limit least(greatest(cantidad, 0), disponibles)
    for update skip locked
  )
  returning s.*;
end;
$$;

revoke execute on function public.tomar_cola(integer, integer) from public, anon;
grant execute on function public.tomar_cola(integer, integer) to authenticated, service_role;

-- Bucket privado para las fotos sugeridas: nada sin aprobar tiene dirección pública.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sugerencias', 'sugerencias', false, 10 * 1024 * 1024, array['image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "personal ve fotos sugeridas" on storage.objects for select to authenticated
  using (bucket_id = 'sugerencias' and (select public.es_personal()));
create policy "personal sube fotos sugeridas" on storage.objects for insert to authenticated
  with check (bucket_id = 'sugerencias' and (select public.es_personal()));
create policy "personal borra fotos sugeridas" on storage.objects for delete to authenticated
  using (bucket_id = 'sugerencias' and (select public.es_personal()));
