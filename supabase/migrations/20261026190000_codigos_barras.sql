-- 001 / T9: códigos de barras. Cada código apunta a un producto (nunca a una añada).

create table public.codigos_barras (
  codigo text primary key check (btrim(codigo) <> ''),
  producto_id uuid not null references public.productos (id) on delete cascade,
  creado_en timestamptz not null default now()
);

create index codigos_barras_producto_idx on public.codigos_barras (producto_id);

alter table public.codigos_barras enable row level security;

grant select, insert, update, delete on public.codigos_barras to service_role;
