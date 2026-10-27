-- 002 / T2: búsqueda pública tolerante a errores.
--
-- Compara el texto normalizado contra el nombre + varietal del producto y contra el
-- nombre de la bodega, con word_similarity de pg_trgm (tolera errores de tipeo y
-- encuentra partes del nombre). Solo busca entre productos disponibles: lee de
-- carta_publica. security definer para leer bodegas, que no es pública.

create function public.buscar_carta(texto text, limite integer default 30)
returns table (
  seccion_id uuid,
  seccion_nombre text,
  seccion_orden integer,
  producto_id uuid,
  producto_tipo public.tipo_producto,
  producto_nombre text,
  bodega_nombre text,
  varietal text,
  descripcion text,
  foto_path text,
  producto_orden integer,
  anada_id uuid,
  anada_tipo public.tipo_anada,
  anio smallint,
  precio numeric,
  relevancia real
)
language sql
stable
security definer
set search_path = ''
as $$
  with consulta as (
    select public.normalizar_busqueda(texto) as q
  ),
  candidatos as (
    select distinct c.producto_id, c.producto_nombre, c.varietal, c.bodega_nombre
    from public.carta_publica c
  ),
  puntuados as (
    select
      cand.producto_id,
      cand.producto_nombre,
      greatest(
        extensions.word_similarity(
          consulta.q,
          public.normalizar_busqueda(cand.producto_nombre || ' ' || coalesce(cand.varietal, ''))
        ),
        coalesce(
          extensions.word_similarity(consulta.q, public.normalizar_busqueda(cand.bodega_nombre)),
          0
        )
      ) as relevancia
    from candidatos cand, consulta
    where char_length(consulta.q) >= 2
  ),
  elegidos as (
    select producto_id, relevancia
    from puntuados
    where relevancia >= 0.5
    order by relevancia desc, producto_nombre
    limit greatest(limite, 0)
  )
  select
    c.seccion_id, c.seccion_nombre, c.seccion_orden, c.producto_id, c.producto_tipo,
    c.producto_nombre, c.bodega_nombre, c.varietal, c.descripcion, c.foto_path,
    c.producto_orden, c.anada_id, c.anada_tipo, c.anio, c.precio, e.relevancia
  from elegidos e
  join public.carta_publica c on c.producto_id = e.producto_id
  order by e.relevancia desc, c.producto_nombre, c.anio desc nulls last;
$$;

revoke execute on function public.buscar_carta(text, integer) from public;
grant execute on function public.buscar_carta(text, integer) to anon, authenticated, service_role;
