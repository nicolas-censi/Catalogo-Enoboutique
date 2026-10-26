-- 001 / T7: añadas. Cada fila es un artículo de Tango.

create table public.anadas (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos (id) on delete cascade,
  codigo_tango text not null unique check (btrim(codigo_tango) <> ''),
  descripcion_tango text not null,
  tipo public.tipo_anada not null,
  anio smallint check (anio between 1900 and 2100),
  precio numeric(12, 2) check (precio >= 0),
  en_stock boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  -- El año es obligatorio solo para las añadas "con año".
  constraint anadas_anio_segun_tipo check ((tipo = 'con_anio') = (anio is not null)),
  -- Un mismo vino no repite año. Las añadas sin año (null) no chocan entre sí.
  constraint anadas_producto_anio_unico unique (producto_id, anio)
);

create trigger anadas_actualizado_en before update on public.anadas
  for each row execute function public.set_actualizado_en();

alter table public.anadas enable row level security;

grant select, insert, update, delete on public.anadas to service_role;
