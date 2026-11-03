-- 007 / T12 (CA-8): interruptor de la IA. Una sola fila; empieza apagada. La ve el
-- personal; la cambia solo el encargado (con cambiar_ia, que registra quién y cuándo).
create table public.ajustes_ia (
  id smallint primary key default 1 check (id = 1),
  activa boolean not null default false,
  cambiada_por uuid references auth.users (id) on delete set null,
  cambiada_en timestamptz
);

insert into public.ajustes_ia (id) values (1);

alter table public.ajustes_ia enable row level security;
revoke all on public.ajustes_ia from anon;
grant select on public.ajustes_ia to authenticated;
grant select, insert, update, delete on public.ajustes_ia to service_role;
create policy "el personal ve si la IA está activa" on public.ajustes_ia for select to authenticated
  using ((select public.es_personal()));

create function public.cambiar_ia(activa boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.es_encargado() then
    raise exception 'Solo el encargado puede prender o apagar la IA.' using errcode = 'insufficient_privilege';
  end if;
  update public.ajustes_ia
  set activa = cambiar_ia.activa, cambiada_por = (select auth.uid()), cambiada_en = now()
  where id = 1;
end;
$$;

revoke execute on function public.cambiar_ia(boolean) from public, anon;
grant execute on function public.cambiar_ia(boolean) to authenticated;
