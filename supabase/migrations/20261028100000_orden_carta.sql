-- 005 / T1: orden de la carta.
--
-- productos.orden pasa a ser la posición entre los destacados de la sección (null = no
-- destacado). El resto se ordena solo, por bodega y precio: la vista carta_publica trae
-- bodega_orden (nombre normalizado, sin tildes ni mayúsculas) y producto_precio_min (la
-- añada disponible más barata del producto).

alter table public.productos alter column orden drop not null;
alter table public.productos alter column orden drop default;
update public.productos set orden = null;

comment on column public.productos.orden is
  'Posición entre los destacados de su sección. null = no destacado (orden automático).';

-- Un producto que cambia de sección deja de ser destacado.
create function public.productos_cambio_seccion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.seccion_id is distinct from old.seccion_id then
    new.orden = null;
  end if;
  return new;
end;
$$;

create trigger productos_cambio_seccion before update of seccion_id on public.productos
  for each row execute function public.productos_cambio_seccion();

-- Nombre de la bodega para ordenar, calculado al guardar. Las funciones que usa una
-- vista se ejecutan con los permisos de quien la lee, y el público no puede llamar a
-- normalizar_busqueda: por eso se guarda ya normalizado.
alter table public.bodegas
  add column nombre_orden text generated always as (public.normalizar_busqueda(nombre)) stored;

create or replace view public.carta_publica
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
  a.precio,
  b.nombre_orden as bodega_orden,
  (select min(a2.precio) from public.anadas a2 where a2.producto_id = p.id and a2.en_stock)
    as producto_precio_min
from public.anadas a
join public.productos p on p.id = a.producto_id
join public.secciones s on s.id = p.seccion_id
left join public.bodegas b on b.id = p.bodega_id
where a.en_stock
  and p.visible
  and s.visible;

comment on view public.carta_publica is
  'Carta pública: una fila por añada disponible. Una sección se ordena por producto_orden '
  '(destacados, nulls last), bodega_orden (nulls last), producto_precio_min desc '
  '(nulls last), producto_nombre y anio desc (nulls last).';
