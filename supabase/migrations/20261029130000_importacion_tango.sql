-- 008 / T6: importación desde Tango.
--
-- abreviaturas: el diccionario para nombres legibles (lo edita el encargado).
-- bodegas.codigo_tango: las letras 3 a 5 del código de los vinos ("VIrut…" → "rut").
-- importaciones: el plan entre el resumen y la confirmación, y el registro de lo hecho.
-- aplicar_importacion: aplica un plan todo junto (si algo falla, no se aplica nada).

create table public.abreviaturas (
  abreviatura text primary key check (abreviatura = upper(btrim(abreviatura)) and abreviatura <> ''),
  expansion text not null check (btrim(expansion) <> ''),
  es_varietal boolean not null default false
);

alter table public.abreviaturas enable row level security;
grant select on public.abreviaturas to authenticated;
grant insert, update, delete on public.abreviaturas to authenticated;
grant select, insert, update, delete on public.abreviaturas to service_role;
create policy "personal ve abreviaturas" on public.abreviaturas for select to authenticated
  using ((select public.es_personal()));
create policy "encargado edita abreviaturas" on public.abreviaturas for all to authenticated
  using ((select public.es_encargado())) with check ((select public.es_encargado()));

-- Diccionario inicial: el mismo que lib/tango/nombres.ts (lo verifica un test).
insert into public.abreviaturas (abreviatura, expansion, es_varietal) values
  ('MAL', 'Malbec', true),
  ('MALBEC', 'Malbec', true),
  ('CAB SAUV', 'Cabernet Sauvignon', true),
  ('CAB SAUVI', 'Cabernet Sauvignon', true),
  ('CS', 'Cabernet Sauvignon', true),
  ('CAB', 'Cabernet', true),
  ('CAB FRANC', 'Cabernet Franc', true),
  ('CAB FRAN', 'Cabernet Franc', true),
  ('CF', 'Cabernet Franc', true),
  ('P NOIR', 'Pinot Noir', true),
  ('PINOT NOIR', 'Pinot Noir', true),
  ('CHARDO', 'Chardonnay', true),
  ('SAUV BLANC', 'Sauvignon Blanc', true),
  ('MER', 'Merlot', true),
  ('TORR', 'Torrontés', true),
  ('SYRAH', 'Syrah', true),
  ('VIOG', 'Viognier', true),
  ('SEM', 'Semillón', true),
  ('BON', 'Bonarda', true),
  ('TANNAT', 'Tannat', true),
  ('P VERDOT', 'Petit Verdot', true),
  ('CHENIN', 'Chenin', true),
  ('RIESLING', 'Riesling', true),
  ('BLEND', 'Blend', true),
  ('RVA', 'Reserva', false),
  ('G', 'Gran', false),
  ('ESP', 'Espumante', false),
  ('EX BRUT', 'Extra Brut', false),
  ('NAT', 'Nature', false),
  ('BCO', 'Blanco', false),
  ('TTO', 'Tinto', false),
  ('ROSE', 'Rosé', false),
  ('SV', 'Single Vineyard', false),
  ('ORG', 'Orgánico', false),
  ('COS TARDIA', 'Cosecha Tardía', false),
  ('TARDIA', 'Tardía', false),
  ('PEQ PROD', 'Pequeñas Producciones', false),
  ('GUALTA', 'Gualtallary', false),
  ('TERR', 'Terroir', false),
  ('CH', 'Champagne', false),
  ('PROY', 'Proyecto', false),
  ('DGO', 'Domingo', false),
  ('TUPUNG', 'Tupungato', false),
  ('MZA', 'Mendoza', false),
  ('APO', 'Apelación', false),
  ('ALT', 'Altitud', false),
  ('CALLEJ', 'Callejón', false),
  ('FCA', 'Finca', false),
  ('FLIA', 'Familia', false),
  ('FGLIA', 'Famiglia', false),
  ('STA', 'Santa', false),
  ('ST', 'Saint', false),
  ('ESC', 'Escorihuela', false),
  ('GASCON', 'Gascón', false),
  ('L BOSCA', 'Luigi Bosca', false),
  ('W', 'Whisky', false),
  ('AOVE', 'AOVE', false),
  ('DV', 'DV', false),
  ('IPA', 'IPA', false);

alter table public.bodegas add column codigo_tango text unique check (codigo_tango = lower(btrim(codigo_tango)));

create table public.importaciones (
  id uuid primary key default gen_random_uuid(),
  creada_en timestamptz not null default now(),
  creada_por uuid references auth.users (id) on delete set null default auth.uid(),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aplicada')),
  plan jsonb not null,
  aplicada_en timestamptz
);

alter table public.importaciones enable row level security;
grant select, insert, update, delete on public.importaciones to authenticated;
grant select, insert, update, delete on public.importaciones to service_role;
create policy "encargado importa" on public.importaciones for all to authenticated
  using ((select public.es_encargado())) with check ((select public.es_encargado()));

create function public.aplicar_importacion(importacion uuid)
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
      (select s.id from public.secciones s
        where s.seccion_padre_id is null and lower(s.nombre) = lower(p ->> 'seccion')
          and not exists (select 1 from public.secciones h where h.seccion_padre_id = s.id)
        limit 1),
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

revoke execute on function public.aplicar_importacion(uuid) from public, anon;
grant execute on function public.aplicar_importacion(uuid) to authenticated;
