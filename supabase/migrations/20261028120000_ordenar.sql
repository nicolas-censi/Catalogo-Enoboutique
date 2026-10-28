-- 005 / T2: guardar el orden de las secciones y de los destacados de una sección.
--
-- Corren con los permisos de quien llama (RLS incluida) y, además, verifican que sea
-- del personal, para no "ordenar" en silencio cero filas.

-- Las secciones de `ids` toman las posiciones 1..n; las que no vinieron (por ejemplo,
-- una recién creada por otra persona) quedan después, en su orden anterior.
create function public.ordenar_secciones(ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.es_personal() then
    raise exception 'Solo el personal puede ordenar la carta.' using errcode = 'insufficient_privilege';
  end if;
  with nuevo as (
    select s.id,
      row_number() over (
        order by array_position(ids, s.id) nulls last, s.orden, s.id
      ) as posicion
    from public.secciones s
  )
  update public.secciones s
  set orden = nuevo.posicion
  from nuevo
  where nuevo.id = s.id and s.orden is distinct from nuevo.posicion;
end;
$$;

-- Los productos de `ids` (todos de la sección) pasan a ser sus destacados en ese orden;
-- el resto de la sección deja de ser destacado.
create function public.ordenar_destacados(seccion uuid, ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.es_personal() then
    raise exception 'Solo el personal puede ordenar la carta.' using errcode = 'insufficient_privilege';
  end if;
  if exists (
    select 1 from unnest(ids) as i(id)
    left join public.productos p on p.id = i.id and p.seccion_id = ordenar_destacados.seccion
    where p.id is null
  ) then
    raise exception 'Ese producto no es de esta sección.' using errcode = 'check_violation';
  end if;
  update public.productos p
  set orden = array_position(ids, p.id)
  where p.seccion_id = ordenar_destacados.seccion
    and p.orden is distinct from array_position(ids, p.id);
end;
$$;

revoke execute on function public.ordenar_secciones(uuid[]) from public, anon;
revoke execute on function public.ordenar_destacados(uuid, uuid[]) from public, anon;
grant execute on function public.ordenar_secciones(uuid[]) to authenticated;
grant execute on function public.ordenar_destacados(uuid, uuid[]) to authenticated;
