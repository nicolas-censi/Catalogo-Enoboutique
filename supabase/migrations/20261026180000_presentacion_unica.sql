-- 001 / T8: los productos que no son vino tienen una única presentación sin año.
--
-- La lógica vive dentro de la función del trigger: Postgres no exige permiso de
-- ejecución sobre una función de trigger al dispararla, así que la regla vale para
-- cualquier usuario (personal incluido) sin exponer la función por la API.

create function public.validar_presentacion_unica()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_producto_id uuid;
  v_tipo public.tipo_producto;
begin
  -- Se arma desde jsonb porque cada tabla tiene columnas distintas en NEW.
  if tg_table_name = 'productos' then
    v_producto_id := (to_jsonb(new) ->> 'id')::uuid;
  else
    v_producto_id := (to_jsonb(new) ->> 'producto_id')::uuid;
  end if;

  -- Bloquea el producto para que dos inserciones simultáneas no esquiven la regla.
  select tipo into v_tipo from public.productos where id = v_producto_id for update;

  if v_tipo is null or v_tipo = 'vino' then
    return null;
  end if;

  if (select count(*) from public.anadas where producto_id = v_producto_id) > 1 then
    raise exception 'Un producto de tipo % admite una sola presentación.', v_tipo
      using errcode = 'check_violation';
  end if;

  if exists (
    select 1 from public.anadas where producto_id = v_producto_id and tipo <> 'sin_anada'
  ) then
    raise exception 'Un producto de tipo % no lleva añada: la presentación tiene que ser sin_anada.', v_tipo
      using errcode = 'check_violation';
  end if;

  return null;
end;
$$;

-- AFTER: así la validación ve todas las filas del mismo insert (ej.: inserts múltiples).
create trigger anadas_validar_tipo_producto
  after insert or update of producto_id, tipo on public.anadas
  for each row execute function public.validar_presentacion_unica();

create trigger productos_validar_cambio_tipo
  after update of tipo on public.productos
  for each row execute function public.validar_presentacion_unica();

-- No se puede llamar por la API (solo la usan los triggers).
revoke execute on function public.validar_presentacion_unica() from public, anon, authenticated;
