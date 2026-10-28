-- 011 / T1: subsecciones. Una subsección es una sección con sección padre, de un solo
-- nivel. Una sección con subsecciones no tiene productos propios: todos están en alguna
-- subsección (crear_subseccion, en T2, los mueve al crear la primera).

alter table public.secciones
  -- Sin "on delete": no se borra una sección con subsecciones, pero sí ambas juntas.
  add column seccion_padre_id uuid references public.secciones (id),
  add constraint secciones_padre_distinto check (seccion_padre_id is distinct from id);

create index secciones_padre_orden_idx on public.secciones (seccion_padre_id, orden);

comment on column public.secciones.seccion_padre_id is
  'Sección a la que pertenece esta subsección (null = sección de primer nivel).';

create function public.secciones_un_nivel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  padre public.secciones;
begin
  if new.seccion_padre_id is null then
    return new;
  end if;
  select * into padre from public.secciones where id = new.seccion_padre_id;
  if padre.seccion_padre_id is not null then
    raise exception 'Una subsección no puede tener subsecciones.' using errcode = 'check_violation';
  end if;
  if exists (select 1 from public.secciones where seccion_padre_id = new.id) then
    raise exception 'Una sección con subsecciones no puede pasar a ser subsección.' using errcode = 'check_violation';
  end if;
  if exists (select 1 from public.productos where seccion_id = new.seccion_padre_id) then
    raise exception '% tiene productos: creá la subsección desde el panel para moverlos.', padre.nombre
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger secciones_un_nivel before insert or update of seccion_padre_id on public.secciones
  for each row execute function public.secciones_un_nivel();

create function public.productos_en_seccion_sin_subsecciones()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  nombre text;
begin
  if new.seccion_id is null then
    return new;
  end if;
  select s.nombre into nombre from public.secciones s
  where s.id = new.seccion_id and exists (select 1 from public.secciones h where h.seccion_padre_id = s.id);
  if nombre is not null then
    raise exception 'Elegí una subsección de %.', nombre using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger productos_en_seccion_sin_subsecciones before insert or update of seccion_id on public.productos
  for each row execute function public.productos_en_seccion_sin_subsecciones();
