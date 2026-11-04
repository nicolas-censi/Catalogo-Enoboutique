-- 007 / T8 y T10: uso de la IA en el mes (hora de Argentina), para el costo estimado de
-- un pedido (CA-2) y el costo del mes en la bandeja (CA-7). Solo el personal.
create function public.resumen_ia_mes()
returns table (
  sugerencias integer,
  busquedas integer,
  costo_usd numeric,
  promedio_entrada integer,
  promedio_salida integer,
  promedio_busquedas numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  desde timestamptz := date_trunc('month', now() at time zone 'America/Argentina/Buenos_Aires')
    at time zone 'America/Argentina/Buenos_Aires';
begin
  if not public.es_personal() then
    raise exception 'Solo el personal.' using errcode = 'insufficient_privilege';
  end if;
  return query
  select
    count(*)::integer,
    coalesce(sum(s.busquedas), 0)::integer,
    coalesce(sum(s.costo_usd), 0)::numeric,
    avg(s.tokens_entrada)::integer,
    avg(s.tokens_salida)::integer,
    avg(s.busquedas)::numeric
  from public.sugerencias s
  where s.procesada_en >= desde and s.tokens_entrada is not null;
end;
$$;

revoke execute on function public.resumen_ia_mes() from public, anon;
grant execute on function public.resumen_ia_mes() to authenticated;
