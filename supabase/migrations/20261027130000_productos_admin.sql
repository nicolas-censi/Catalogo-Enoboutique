-- 004 / T4: resumen de productos para la lista del panel.
--
-- security_invoker = true: respeta RLS, así solo el personal ve filas.

create view public.productos_admin
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
  count(a.id) filter (where a.tipo = 'sin_especificar')::integer as anadas_a_revisar
from public.productos p
left join public.bodegas b on b.id = p.bodega_id
left join public.secciones s on s.id = p.seccion_id
left join public.anadas a on a.producto_id = p.id
group by p.id, b.nombre, s.nombre;

revoke all on public.productos_admin from public, anon;
grant select on public.productos_admin to authenticated, service_role;
