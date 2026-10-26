-- 001 / T12: búsqueda pública por código de barras.
--
-- Devuelve las filas de carta_publica del producto asociado al código: el vino con
-- todas sus añadas disponibles. security definer para poder leer codigos_barras, que
-- no es pública; solo expone lo que ya expone carta_publica.

create function public.buscar_por_codigo_barras(codigo text)
returns setof public.carta_publica
language sql
stable
security definer
set search_path = ''
as $$
  select c.*
  from public.carta_publica c
  join public.codigos_barras cb on cb.producto_id = c.producto_id
  where cb.codigo = btrim(buscar_por_codigo_barras.codigo)
  order by c.anio desc nulls last;
$$;

revoke execute on function public.buscar_por_codigo_barras(text) from public;
grant execute on function public.buscar_por_codigo_barras(text) to anon, authenticated, service_role;
