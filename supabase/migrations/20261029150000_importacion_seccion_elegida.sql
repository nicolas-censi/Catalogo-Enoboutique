-- 008 / T12: al importar, el encargado puede elegir la sección de cada producto nuevo
-- (CA-11): el plan trae seccionId (una sección o subsección que ya existe) y se usa en
-- lugar de la sugerida por nombre.

create or replace function public.aplicar_importacion(importacion uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  plan jsonb;
  nombre_seccion text;
  b jsonb;
  p jsonb;
  a jsonb;
  c jsonb;
  producto uuid;
begin
  if not public.es_encargado() then
    raise exception 'Solo el encargado puede importar.' using errcode = 'insufficient_privilege';
  end if;
  select i.plan into plan from public.importaciones i where i.id = importacion and i.estado = 'pendiente' for update;
  if plan is null then
    raise exception 'Esta importación ya se aplicó o no existe. Volvé a subir el archivo.' using errcode = 'check_violation';
  end if;

  -- Secciones nuevas (de primer nivel), al final de la carta.
  for nombre_seccion in select jsonb_array_elements_text(plan -> 'seccionesNuevas') loop
    if not exists (
      select 1 from public.secciones s
      where s.seccion_padre_id is null and lower(s.nombre) = lower(nombre_seccion)
    ) then
      insert into public.secciones (nombre, orden)
      values (
        nombre_seccion,
        coalesce((select max(s.orden) from public.secciones s where s.seccion_padre_id is null), 0) + 1
      );
    end if;
  end loop;

  -- Bodegas: se le asigna el código a una que ya existe, o se crea.
  for b in select * from jsonb_array_elements(plan -> 'bodegasNuevas') loop
    if b ->> 'existenteId' is not null then
      update public.bodegas set codigo_tango = b ->> 'codigo' where id = (b ->> 'existenteId')::uuid;
    else
      insert into public.bodegas (nombre, codigo_tango) values (b ->> 'nombre', b ->> 'codigo');
    end if;
  end loop;

  -- Productos nuevos, con sus añadas y códigos de barras.
  for p in select * from jsonb_array_elements(plan -> 'productosNuevos') loop
    insert into public.productos (tipo, nombre, varietal, bodega_id, seccion_id, visible)
    values (
      (p ->> 'tipo')::public.tipo_producto,
      p ->> 'nombre',
      p ->> 'varietal',
      (select id from public.bodegas where codigo_tango = p ->> 'bodegaCodigo'),
      -- La sección que eligió el encargado (también una subsección) o, si no eligió, la
      -- sugerida por nombre.
      coalesce(
        (p ->> 'seccionId')::uuid,
        (select s.id from public.secciones s
          where s.seccion_padre_id is null and lower(s.nombre) = lower(p ->> 'seccion')
            and not exists (select 1 from public.secciones h where h.seccion_padre_id = s.id)
          limit 1)
      ),
      (p ->> 'visible')::boolean
    )
    returning id into producto;
    for a in select * from jsonb_array_elements(p -> 'anadas') loop
      insert into public.anadas (producto_id, codigo_tango, descripcion_tango, tipo, anio, precio, en_stock)
      values (
        producto, a ->> 'codigo', a ->> 'descripcion', (a ->> 'tipo')::public.tipo_anada,
        (a ->> 'anio')::smallint, (a ->> 'precio')::numeric, (a ->> 'enStock')::boolean
      );
    end loop;
    insert into public.codigos_barras (codigo, producto_id)
    select codigo, producto from jsonb_array_elements_text(p -> 'codigosBarras') as codigo;
  end loop;

  -- Añadas nuevas de productos que ya están.
  for a in select * from jsonb_array_elements(plan -> 'anadasNuevas') loop
    insert into public.anadas (producto_id, codigo_tango, descripcion_tango, tipo, anio, precio, en_stock)
    values (
      (a ->> 'productoId')::uuid, a ->> 'codigo', a ->> 'descripcion', (a ->> 'tipo')::public.tipo_anada,
      (a ->> 'anio')::smallint, (a ->> 'precio')::numeric, (a ->> 'enStock')::boolean
    );
  end loop;

  for c in select * from jsonb_array_elements(plan -> 'codigosBarrasNuevos') loop
    insert into public.codigos_barras (codigo, producto_id) values (c ->> 'codigo', (c ->> 'productoId')::uuid);
  end loop;

  -- Precios: el de Tango pisa al del panel.
  update public.anadas an
  set precio = (x ->> 'nuevo')::numeric
  from jsonb_array_elements(plan -> 'precios') as x
  where an.codigo_tango = x ->> 'codigo';

  update public.importaciones set estado = 'aplicada', aplicada_en = now() where id = importacion;
exception
  when unique_violation or foreign_key_violation then
    raise exception 'La carta cambió desde que subiste el archivo. Volvé a subirlo para ver el resumen actualizado.'
      using errcode = 'check_violation';
end;
$$;
