-- 011 / T2: crear subsecciones y ordenar secciones entre hermanas.

-- Crea la subsección al final de sus hermanas. Si es la primera y la sección tiene
-- productos, se los lleva todos (con sus destacados): ningún producto queda suelto.
create function public.crear_subseccion(padre uuid, nombre text)
returns table (id uuid, movidos integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  nueva uuid;
  cantidad integer;
  destacados jsonb;
begin
  if not public.es_personal() then
    raise exception 'Solo el personal puede crear subsecciones.' using errcode = 'insufficient_privilege';
  end if;
  if (select s.seccion_padre_id from public.secciones s where s.id = padre) is not null then
    raise exception 'Una subsección no puede tener subsecciones.' using errcode = 'check_violation';
  end if;

  -- Se crea primero sin padre, para poder mover los productos antes de colgarla.
  insert into public.secciones (nombre, orden)
  values (
    btrim(nombre),
    coalesce((select max(s.orden) from public.secciones s where s.seccion_padre_id = padre), 0) + 1
  )
  returning secciones.id into nueva;

  -- Al cambiar de sección se pierde el destacado (spec 005): se guarda y se restaura.
  select coalesce(jsonb_object_agg(p.id, p.orden), '{}') into destacados
  from public.productos p where p.seccion_id = padre and p.orden is not null;
  update public.productos p set seccion_id = nueva where p.seccion_id = padre;
  get diagnostics cantidad = row_count;
  update public.productos p set orden = (destacados ->> p.id::text)::integer
  where p.seccion_id = nueva and destacados ? p.id::text;

  update public.secciones s set seccion_padre_id = padre where s.id = nueva;
  return query select nueva, cantidad;
end;
$$;

revoke execute on function public.crear_subseccion(uuid, text) from public, anon;
grant execute on function public.crear_subseccion(uuid, text) to authenticated;

-- Ordena secciones del mismo nivel (todas de primer nivel, o todas subsecciones de la
-- misma sección). Las hermanas que no vinieron quedan al final; el resto no se toca.
create or replace function public.ordenar_secciones(ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  padre uuid;
begin
  if not public.es_personal() then
    raise exception 'Solo el personal puede ordenar la carta.' using errcode = 'insufficient_privilege';
  end if;
  if (select count(distinct coalesce(s.seccion_padre_id::text, '')) from public.secciones s where s.id = any (ids)) > 1 then
    raise exception 'Solo se ordenan juntas las secciones del mismo nivel.' using errcode = 'check_violation';
  end if;
  select s.seccion_padre_id into padre from public.secciones s where s.id = any (ids) limit 1;
  with nuevo as (
    select s.id,
      row_number() over (
        order by array_position(ids, s.id) nulls last, s.orden, s.id
      ) as posicion
    from public.secciones s
    where s.seccion_padre_id is not distinct from padre
  )
  update public.secciones s
  set orden = nuevo.posicion
  from nuevo
  where nuevo.id = s.id and s.orden is distinct from nuevo.posicion;
end;
$$;
