-- 002 / T3: buscar_carta también busca por código de barras completo.
--
-- Si el texto son solo dígitos (8 a 14), se busca el código exacto y no por nombre.
-- Reemplaza la función de T2 manteniendo su firma.

create or replace function public.buscar_carta(texto text, limite integer default 30)
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
    select
      public.normalizar_busqueda(texto) as q,
      -- Solo dígitos, entre 8 y 14: es un código de barras (EAN-8, UPC, EAN-13, GTIN-14).
      coalesce(btrim(texto) ~ '^[0-9]{8,14}$', false) as es_codigo
  ),
  por_codigo as (
    select r.*, 1::real as relevancia
    from consulta, public.buscar_por_codigo_barras(btrim(texto)) r
    where consulta.es_codigo
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
    where char_length(consulta.q) >= 2 and not consulta.es_codigo
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
  union all
  select * from por_codigo
  order by relevancia desc, producto_nombre, anio desc nulls last;
$$;

