-- Measurements on the supplied shirt chart are in inches.
alter table public.rrih_shirt_sizes
  add column if not exists chest_in smallint check (chest_in > 0),
  add column if not exists length_in smallint check (length_in > 0);

-- Keep the old XS row for any historical references, but remove it from new applications.
update public.rrih_shirt_sizes set active = false where code = 'XS';

insert into public.rrih_shirt_sizes (code,label,chest_in,length_in,active,sort_order) values
  ('SS','SS',34,25,true,1),
  ('S','S',36,26,true,2),
  ('M','M',38,27,true,3),
  ('L','L',40,28,true,4),
  ('XL','XL',42,29,true,5),
  ('2XL','2XL',44,30,true,6),
  ('3XL','3XL',46,31,true,7),
  ('4XL','4XL',50,33,true,8),
  ('5XL','5XL',54,34,true,9),
  ('6XL','6XL',58,35,true,10)
on conflict (code) do update set
  label=excluded.label,chest_in=excluded.chest_in,length_in=excluded.length_in,
  active=true,sort_order=excluded.sort_order;
