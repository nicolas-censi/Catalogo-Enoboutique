-- Datos de ejemplo para el proyecto de desarrollo, tomados del export real de Tango
-- ("Precios por artículo"). Sirven para ver la carta con casos reales.
--
-- Es idempotente: borra y vuelve a crear solo estas filas (ids fijos 5eed...).
-- Se carga con `npm run db:seed` o con `supabase db reset` en un Supabase local.

begin;

delete from public.productos where id::text like '5eed0000-0000-4000-8000-0000000002%';
-- Subsecciones creadas a mano dentro de las secciones de ejemplo (spec 011), si quedaron
-- vacías: sin esto no se pueden borrar las secciones de ejemplo.
delete from public.secciones s
where s.seccion_padre_id::text like '5eed0000-0000-4000-8000-0000000001%'
  and not exists (select 1 from public.productos p where p.seccion_id = s.id);
delete from public.secciones where id::text like '5eed0000-0000-4000-8000-0000000001%';

insert into public.secciones (id, nombre, orden, visible) values
  ('5eed0000-0000-4000-8000-000000000101', 'Cava', 1, true),
  ('5eed0000-0000-4000-8000-000000000102', 'Tintos', 2, true),
  ('5eed0000-0000-4000-8000-000000000103', 'Blancos', 3, true),
  ('5eed0000-0000-4000-8000-000000000104', 'Espumantes', 4, true),
  ('5eed0000-0000-4000-8000-000000000105', 'Destilados', 5, true),
  ('5eed0000-0000-4000-8000-000000000106', 'Almacén', 6, true),
  ('5eed0000-0000-4000-8000-000000000107', 'Próximamente', 7, false);

-- Las bodegas no se borran: pueden tener su código de Tango (spec 008). Si ya existe una
-- con ese nombre, se usa esa.
insert into public.bodegas (nombre) values
  ('Rutini'),
  ('Salentein'),
  ('Zuccardi'),
  ('Trapiche')
on conflict (nombre) do nothing;

insert into public.productos (id, tipo, nombre, bodega_id, varietal, seccion_id) values
  ('5eed0000-0000-4000-8000-000000000201', 'vino', 'Rutini Malbec',
    (select id from public.bodegas where nombre = 'Rutini'), 'Malbec', '5eed0000-0000-4000-8000-000000000101'),
  ('5eed0000-0000-4000-8000-000000000202', 'vino', 'Salentein Primus Malbec',
    (select id from public.bodegas where nombre = 'Salentein'), 'Malbec', '5eed0000-0000-4000-8000-000000000101'),
  ('5eed0000-0000-4000-8000-000000000203', 'vino', 'Zuccardi Q Malbec',
    (select id from public.bodegas where nombre = 'Zuccardi'), 'Malbec', '5eed0000-0000-4000-8000-000000000102'),
  ('5eed0000-0000-4000-8000-000000000204', 'vino', 'Costa & Pampa Sauvignon Blanc',
    (select id from public.bodegas where nombre = 'Trapiche'), 'Sauvignon Blanc', '5eed0000-0000-4000-8000-000000000103'),
  ('5eed0000-0000-4000-8000-000000000205', 'vino', 'Salentein Brut Nature',
    (select id from public.bodegas where nombre = 'Salentein'), null, '5eed0000-0000-4000-8000-000000000104'),
  ('5eed0000-0000-4000-8000-000000000206', 'destilado', 'Glenmorangie Original',
    null, null, '5eed0000-0000-4000-8000-000000000105'),
  ('5eed0000-0000-4000-8000-000000000207', 'aceite', 'AOVE Zuccardi Picual 500 cc',
    (select id from public.bodegas where nombre = 'Zuccardi'), null, '5eed0000-0000-4000-8000-000000000106'),
  ('5eed0000-0000-4000-8000-000000000208', 'almacen', 'Sal gourmet Salva Malbec',
    null, null, '5eed0000-0000-4000-8000-000000000106'),
  ('5eed0000-0000-4000-8000-000000000209', 'vino', 'Zuccardi Q Malbec Magnum',
    (select id from public.bodegas where nombre = 'Zuccardi'), 'Malbec', '5eed0000-0000-4000-8000-000000000107');

insert into public.anadas (producto_id, codigo_tango, descripcion_tango, tipo, anio, precio, en_stock) values
  -- Rutini Malbec: varias añadas; la 2017 sin stock no aparece en la carta.
  ('5eed0000-0000-4000-8000-000000000201', 'VIrut0080', 'RUTINI MAL 2023', 'con_anio', 2023, 36000, true),
  ('5eed0000-0000-4000-8000-000000000201', 'VIrut0079', 'RUTINI MAL 2022', 'con_anio', 2022, 40000, true),
  ('5eed0000-0000-4000-8000-000000000201', 'VIrut0028', 'RUTINI MAL 2021', 'con_anio', 2021, 43000, true),
  ('5eed0000-0000-4000-8000-000000000201', 'VIrut0015', 'RUTINI MAL 2020', 'con_anio', 2020, 47000, true),
  ('5eed0000-0000-4000-8000-000000000201', 'VIrut0074', 'RUTINI MAL 2018', 'con_anio', 2018, 54000, true),
  ('5eed0000-0000-4000-8000-000000000201', 'VIrut0077', 'RUTINI MAL 2017', 'con_anio', 2017, 58000, false),
  -- Salentein Primus Malbec: el código de barras está en el artículo sin año.
  ('5eed0000-0000-4000-8000-000000000202', 'VIsal0081', 'SALENTEIN PRIMUS MAL 2022', 'con_anio', 2022, 54000, true),
  ('5eed0000-0000-4000-8000-000000000202', 'VIsal0066', 'SALENTEIN PRIMUS MAL 2021', 'con_anio', 2021, 59000, true),
  ('5eed0000-0000-4000-8000-000000000202', 'VIsal0076', 'SALENTEIN PRIMUS MAL 2019', 'con_anio', 2019, 61800, true),
  ('5eed0000-0000-4000-8000-000000000202', 'VIsal0002', 'SALENTEIN PRIMUS MAL', 'sin_especificar', null, 70800, true),
  -- Zuccardi Q Malbec: dos artículos sin año con precios distintos, pendientes de revisión.
  ('5eed0000-0000-4000-8000-000000000203', 'VIzuc0117', 'ZUCCARDI Q MAL 2023', 'con_anio', 2023, 22550, true),
  ('5eed0000-0000-4000-8000-000000000203', 'VIzuc0031', 'ZUCCARDI Q MAL 2021', 'con_anio', 2021, 26650, true),
  ('5eed0000-0000-4000-8000-000000000203', 'VIzuc0018', 'ZUCCARDI Q MAL 2020', 'con_anio', 2020, 28700, true),
  ('5eed0000-0000-4000-8000-000000000203', 'VIzuc0111', 'ZUCCARDI Q MAL 2019', 'con_anio', 2019, 30750, true),
  ('5eed0000-0000-4000-8000-000000000203', 'VIzuc0088', 'ZUCCARDI Q MAL 2004', 'con_anio', 2004, 86200, false),
  ('5eed0000-0000-4000-8000-000000000203', 'VIzuc0073', 'ZUCCARDI Q MAL', 'sin_especificar', null, 69600, true),
  ('5eed0000-0000-4000-8000-000000000203', 'VIzuc0120', 'ZUCCARDI Q MAL', 'sin_especificar', null, 20500, true),
  -- Precio 0 en Tango: se carga sin precio y la carta muestra "Consultar precio".
  ('5eed0000-0000-4000-8000-000000000204', 'VItra0027', 'COSTA & PAMPA SAUV BLANC 2016', 'con_anio', 2016, null, true),
  ('5eed0000-0000-4000-8000-000000000205', 'VIsal0016', 'SALENTEIN ESP BRUT NAT', 'sin_anada', null, 13200, true),
  ('5eed0000-0000-4000-8000-000000000206', 'BAotr0003', 'W GLENMORANGIE ORIGINAL', 'sin_anada', null, 106000, true),
  ('5eed0000-0000-4000-8000-000000000207', 'ACzuc0003', 'AOVE ZUCCARDI PICUAL 500CC', 'sin_anada', null, 20300, true),
  ('5eed0000-0000-4000-8000-000000000208', 'ALsal0001', 'SAL GOURMET SALVA MAL', 'sin_anada', null, 3300, true),
  -- En una sección oculta: no aparece en la carta aunque tenga stock.
  ('5eed0000-0000-4000-8000-000000000209', 'VIzuc0079', 'ZUCCARDI Q MAL MAGNUM', 'sin_especificar', null, 49900, true);

insert into public.codigos_barras (codigo, producto_id) values
  ('7798074860141', '5eed0000-0000-4000-8000-000000000202'),
  ('7798074861179', '5eed0000-0000-4000-8000-000000000205'),
  ('7791728234367', '5eed0000-0000-4000-8000-000000000207'),
  ('7791728001709', '5eed0000-0000-4000-8000-000000000209');

commit;
