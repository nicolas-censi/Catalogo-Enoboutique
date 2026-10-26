-- 001 / T10: personal (encargado y vendedor) y permisos (RLS).
--
-- Regla: el personal lee y modifica todo; nadie más accede a las tablas.
-- El público verá la carta solo a través de la vista y la función de T11 y T12.

create table public.personal (
  user_id uuid primary key references auth.users (id) on delete cascade,
  rol text not null check (rol in ('encargado', 'vendedor')),
  creado_en timestamptz not null default now()
);

alter table public.personal enable row level security;

-- security definer: lee `personal` sin depender de sus propias políticas.
create function public.es_personal()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.personal where user_id = (select auth.uid()));
$$;

revoke execute on function public.es_personal() from public, anon;
grant execute on function public.es_personal() to authenticated;

-- Las tablas no se exponen al rol anónimo.
revoke all on public.secciones, public.bodegas, public.productos, public.anadas,
  public.codigos_barras, public.personal from anon;

-- El personal lee y modifica todas las tablas de la carta.
grant select, insert, update, delete on public.secciones, public.bodegas, public.productos,
  public.anadas, public.codigos_barras to authenticated;

create policy "personal gestiona secciones" on public.secciones for all to authenticated
  using ((select public.es_personal())) with check ((select public.es_personal()));
create policy "personal gestiona bodegas" on public.bodegas for all to authenticated
  using ((select public.es_personal())) with check ((select public.es_personal()));
create policy "personal gestiona productos" on public.productos for all to authenticated
  using ((select public.es_personal())) with check ((select public.es_personal()));
create policy "personal gestiona anadas" on public.anadas for all to authenticated
  using ((select public.es_personal())) with check ((select public.es_personal()));
create policy "personal gestiona codigos de barras" on public.codigos_barras for all
  to authenticated
  using ((select public.es_personal())) with check ((select public.es_personal()));

-- `personal` es de solo lectura por la API: las altas se hacen desde el panel de Supabase.
revoke insert, update, delete, truncate on public.personal from authenticated;
grant select on public.personal to authenticated;
grant select, insert, update, delete on public.personal to service_role;

create policy "personal ve al personal" on public.personal for select to authenticated
  using ((select public.es_personal()));
