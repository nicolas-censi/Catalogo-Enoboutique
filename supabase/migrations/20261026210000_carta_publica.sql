-- 001 / T11: vista pública de la carta.
--
-- Una fila por añada visible. Es lo único de la carta que puede leer el público.
-- Corre con los permisos de su dueño (security_invoker = false), así que no depende
-- de las políticas RLS de las tablas: el filtro de visibilidad está acá.
-- No expone códigos de Tango, descripciones internas ni el stock.

create view public.carta_publica
with (security_invoker = false)
as
select
  s.id as seccion_id,
  s.nombre as seccion_nombre,
  s.orden as seccion_orden,
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
  a.precio
from public.anadas a
join public.productos p on p.id = a.producto_id
join public.secciones s on s.id = p.seccion_id
left join public.bodegas b on b.id = p.bodega_id
where a.en_stock
  and p.visible
  and s.visible;

comment on view public.carta_publica is
  'Carta pública: una fila por añada disponible. Ordenar por seccion_orden, producto_orden y anio desc (nulls last).';

revoke all on public.carta_publica from public, anon, authenticated;
grant select on public.carta_publica to anon, authenticated, service_role;
