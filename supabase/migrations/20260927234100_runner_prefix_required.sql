-- Every competitor must choose a title. Existing rows have already been checked.
alter table public.rrih_participants
  add constraint rrih_runner_prefix_required
  check (role <> 'RUNNER' or nullif(btrim(prefix), '') is not null);
