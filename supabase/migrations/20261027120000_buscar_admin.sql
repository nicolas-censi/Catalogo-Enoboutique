-- 004 / T3: búsqueda del panel.
--
-- Como buscar_carta, pero sobre TODOS los productos (ocultos, sin stock, sin sección,
-- sin añadas) y además por código de Tango y código de barras exactos.
-- security invoker: corre con los permisos de quien llama, así RLS deja ver los
-- productos solo al personal.

create function public.buscar_admin(texto text, limite integer default 50)
returns table (producto_id uuid, relevancia real)
language sql
stable
security invoker
set search_path = ''
as $$
  with consulta as (
    select btrim(texto) as t, public.normalizar_busqueda(texto) as q
  ),
  exactas as (
    -- Código de Tango exacto (sin importar mayúsculas)
    select a.producto_id, 1::real as relevancia
    from public.anadas a, consulta
    where lower(a.codigo_tango) = lower(consulta.t)
    union all
    -- Código de barras exacto
    select cb.producto_id, 1::real
    from public.codigos_barras cb, consulta
    where cb.codigo = consulta.t
  ),
  coincidencias as (
    select * from exactas
    union all
    -- Nombre + varietal, o bodega, tolerando errores. Si el texto es un código que
    -- coincide exacto, no se buscan parecidos: se quiere esa botella puntual.
    select p.id,
      greatest(
        extensions.word_similarity(
          consulta.q,
          public.normalizar_busqueda(p.nombre || ' ' || coalesce(p.varietal, ''))
        ),
        coalesce(extensions.word_similarity(consulta.q, public.normalizar_busqueda(b.nombre)), 0)
      )
    from public.productos p
    left join public.bodegas b on b.id = p.bodega_id
    cross join consulta
    where char_length(consulta.q) >= 2 and not exists (select 1 from exactas)
  )
  select c.producto_id, max(c.relevancia) as relevancia
  from coincidencias c
  where c.relevancia >= 0.5
  group by c.producto_id
  order by max(c.relevancia) desc, c.producto_id
  limit greatest(limite, 0);
$$;

revoke execute on function public.buscar_admin(text, integer) from public, anon;
grant execute on function public.buscar_admin(text, integer) to authenticated, service_role;
