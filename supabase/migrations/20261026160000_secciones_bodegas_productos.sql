-- 001 / T6: secciones, bodegas y productos.

create type public.tipo_producto as enum ('vino', 'destilado', 'aceite', 'almacen');
create type public.tipo_anada as enum ('con_anio', 'sin_especificar', 'sin_anada');

-- Mantiene actualizado_en al día en cada update.
create function public.set_actualizado_en()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

create table public.secciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (btrim(nombre) <> ''),
  orden integer not null,
  visible boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table public.bodegas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique check (btrim(nombre) <> ''),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  tipo public.tipo_producto not null,
  nombre text not null check (btrim(nombre) <> ''),
  bodega_id uuid references public.bodegas (id) on delete set null,
  varietal text,
  descripcion text,
  foto_path text,
  seccion_id uuid references public.secciones (id) on delete set null,
  orden integer not null default 0,
  visible boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index productos_seccion_orden_idx on public.productos (seccion_id, orden);
create index productos_bodega_idx on public.productos (bodega_id);

create trigger secciones_actualizado_en before update on public.secciones
  for each row execute function public.set_actualizado_en();
create trigger bodegas_actualizado_en before update on public.bodegas
  for each row execute function public.set_actualizado_en();
create trigger productos_actualizado_en before update on public.productos
  for each row execute function public.set_actualizado_en();

-- RLS activado desde el inicio: sin políticas, nadie salvo service_role accede.
-- Las políticas para el personal y la vista pública llegan en T10 y T11.
alter table public.secciones enable row level security;
alter table public.bodegas enable row level security;
alter table public.productos enable row level security;

grant select, insert, update, delete on public.secciones, public.bodegas, public.productos
  to service_role;
