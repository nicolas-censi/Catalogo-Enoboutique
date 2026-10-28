-- 011 / T3: la carta y el panel con subsecciones.
--
-- En carta_publica, seccion_* es siempre la sección de primer nivel (la que se ve en el
-- inicio) y subseccion_* la subsección del producto, si tiene. Un producto se ve solo si
-- su sección y la sección padre están visibles.

create or replace view public.carta_publica
with (security_invoker = false)
as
select
  coalesce(padre.id, s.id) as seccion_id,
  coalesce(padre.nombre, s.nombre) as seccion_nombre,
  coalesce(padre.orden, s.orden) as seccion_orden,
  p.id as producto_id,
  p.tipo as producto_tipo,
  p.nombre as producto_nombre,
  b.nombre as bodega_nombre,
  p.varietal,
  p.descripcion,
  p.foto_path,
  p.orden as producto_orden,
  a.id as anada_id,
  a.tipo as anada_tipo,
  a.anio,
  a.precio,
  b.nombre_orden as bodega_orden,
  (select min(a2.precio) from public.anadas a2 where a2.producto_id = p.id and a2.en_stock)
    as producto_precio_min,
  case when padre.id is not null then s.id end as subseccion_id,
  case when padre.id is not null then s.nombre end as subseccion_nombre,
  case when padre.id is not null then s.orden end as subseccion_orden
from public.anadas a
join public.productos p on p.id = a.producto_id
join public.secciones s on s.id = p.seccion_id
left join public.secciones padre on padre.id = s.seccion_padre_id
left join public.bodegas b on b.id = p.bodega_id
where a.en_stock
  and p.visible
  and s.visible
  and (padre.id is null or padre.visible);

comment on view public.carta_publica is
  'Carta pública: una fila por añada disponible. seccion_* es la sección de primer nivel y '
  'subseccion_* la subsección (si hay). Una sección se ordena por subseccion_orden, '
  'producto_orden (destacados, nulls last), bodega_orden (nulls last), producto_precio_min '
  'desc (nulls last), producto_nombre y anio desc (nulls last).';

create or replace view public.productos_admin
with (security_invoker = true)
as
select
  p.id,
  p.tipo,
  p.nombre,
  b.nombre as bodega_nombre,
  p.varietal,
  p.seccion_id,
  s.nombre as seccion_nombre,
  p.visible,
  p.foto_path,
  count(a.id)::integer as cantidad_anadas,
  count(a.id) filter (where a.en_stock)::integer as anadas_en_stock,
  count(a.id) filter (where a.tipo = 'sin_especificar')::integer as anadas_a_revisar,
  s.seccion_padre_id,
  padre.nombre as seccion_padre_nombre
from public.productos p
left join public.bodegas b on b.id = p.bodega_id
left join public.secciones s on s.id = p.seccion_id
left join public.secciones padre on padre.id = s.seccion_padre_id
left join public.anadas a on a.producto_id = p.id
group by p.id, b.nombre, s.nombre, s.seccion_padre_id, padre.nombre;
