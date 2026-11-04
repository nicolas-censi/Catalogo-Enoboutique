-- 014 / T4: la lista del panel muestra el precio ("Desde $ …") y si hay una sugerencia
-- de la IA para revisar. Se agregan columnas al final de productos_admin.
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
  padre.nombre as seccion_padre_nombre,
  min(a.precio) filter (where a.en_stock) as precio_desde,
  max(a.precio) filter (where a.en_stock) as precio_hasta,
  exists (select 1 from public.sugerencias g where g.producto_id = p.id and g.estado = 'lista') as sugerencia_lista
from public.productos p
left join public.bodegas b on b.id = p.bodega_id
left join public.secciones s on s.id = p.seccion_id
left join public.secciones padre on padre.id = s.seccion_padre_id
left join public.anadas a on a.producto_id = p.id
group by p.id, b.nombre, s.nombre, s.seccion_padre_id, padre.nombre;
