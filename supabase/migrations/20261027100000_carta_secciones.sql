-- 002 / T4: secciones de la carta pública (para el inicio).
--
-- Una fila por sección visible con al menos un producto disponible. Evita que el
-- inicio tenga que descargar todas las añadas de carta_publica para listar secciones.

create view public.carta_secciones
with (security_invoker = false)
as
select distinct seccion_id as id, seccion_nombre as nombre, seccion_orden as orden
from public.carta_publica;

comment on view public.carta_secciones is
  'Secciones visibles con productos disponibles. Ordenar por orden.';

revoke all on public.carta_secciones from public, anon, authenticated;
grant select on public.carta_secciones to anon, authenticated, service_role;
