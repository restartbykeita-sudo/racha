create index if not exists rrih_beneficiaries_registration_runner_idx
  on public.rrih_beneficiaries (registration_id, runner_id);
create index if not exists rrih_payment_attempts_reviewer_idx
  on public.rrih_payment_attempts (reviewed_by);
create index if not exists rrih_registrations_package_idx
  on public.rrih_registrations (package_code);
