-- 002 / T1: base de la búsqueda tolerante a errores.

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- Minúsculas, sin tildes y con espacios simples. Inmutable (con el diccionario
-- explícito) para poder usarla en índices.
create function public.normalizar_busqueda(texto text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select coalesce(
    btrim(regexp_replace(
      lower(extensions.unaccent('extensions.unaccent'::regdictionary, texto)),
      '\s+', ' ', 'g'
    )),
    ''
  );
$$;

-- authenticated la necesita: los índices de abajo la evalúan al guardar productos y
-- bodegas con el usuario que guarda (el personal). Es inofensiva: solo normaliza texto.
revoke execute on function public.normalizar_busqueda(text) from public, anon;
grant execute on function public.normalizar_busqueda(text) to authenticated, service_role;

-- Índices de trigramas: el nombre y el varietal del producto, y el nombre de la bodega.
create index productos_busqueda_trgm_idx on public.productos using gin (
  public.normalizar_busqueda(nombre || ' ' || coalesce(varietal, '')) extensions.gin_trgm_ops
);
create index bodegas_busqueda_trgm_idx on public.bodegas using gin (
  public.normalizar_busqueda(nombre) extensions.gin_trgm_ops
);
