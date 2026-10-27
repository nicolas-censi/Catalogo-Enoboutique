-- 004 / T16: el encargado gestiona el personal.
--
-- Solo un encargado puede dar de alta, cambiar el rol o dar de baja. Nadie puede
-- quitarse a sí mismo el rol de encargado ni darse de baja: así siempre queda al
-- menos un encargado (el que hace el cambio).

create function public.es_encargado()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.personal where user_id = (select auth.uid()) and rol = 'encargado'
  );
$$;

revoke execute on function public.es_encargado() from public, anon;
grant execute on function public.es_encargado() to authenticated;

grant insert, delete on public.personal to authenticated;
grant update (rol) on public.personal to authenticated;

create policy "encargado da de alta personal" on public.personal for insert to authenticated
  with check ((select public.es_encargado()));
create policy "encargado cambia roles" on public.personal for update to authenticated
  using ((select public.es_encargado())) with check ((select public.es_encargado()));
create policy "encargado da de baja personal" on public.personal for delete to authenticated
  using ((select public.es_encargado()));

-- Nadie se quita el rol de encargado ni se da de baja a sí mismo (desde la app).
create function public.personal_proteger_propio()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.user_id = (select auth.uid())
     and old.rol = 'encargado' and new.rol <> 'encargado' then
    raise exception 'No podés quitarte a vos mismo el rol de encargado.'
      using errcode = 'check_violation';
  end if;
  if tg_op = 'DELETE' and old.user_id = (select auth.uid()) then
    raise exception 'No podés darte de baja a vos mismo.'
      using errcode = 'check_violation';
  end if;
  return case tg_op when 'DELETE' then old else new end;
end;
$$;

create trigger personal_proteger_propio
  before update or delete on public.personal
  for each row execute function public.personal_proteger_propio();

revoke execute on function public.personal_proteger_propio() from public, anon, authenticated;
