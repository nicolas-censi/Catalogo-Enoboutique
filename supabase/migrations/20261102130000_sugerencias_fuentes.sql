-- 007 / T3: las fuentes guardan título y dirección (la búsqueda de Gemini da enlaces de
-- redirección; el título es el sitio). Formato: [{ "titulo": "...", "url": "https://..." }].
alter table public.sugerencias drop column fuentes;
alter table public.sugerencias add column fuentes jsonb not null default '[]'::jsonb
  check (jsonb_typeof(fuentes) = 'array');
