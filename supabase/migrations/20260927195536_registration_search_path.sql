-- Keep built-in resolution fixed when IDs are normalized in generated columns.
alter function public.rrih_normalize_id(text) set search_path = '';
