-- RESTART RACHA ISLAND HYBRID registration. Apply only to the confirmed event project.
-- All sensitive writes go through service-role-only, security-invoker RPCs.

create or replace function public.rrih_normalize_id(value text)
returns text language sql immutable strict parallel safe
as $$
  select upper(regexp_replace(normalize(value, NFKC), '[[:space:]‐‑‒–—―−﹣－-]+', '', 'g'));
$$;

create table if not exists public.rrih_settings (
  id integer primary key default 1 check (id = 1),
  event_name text not null default 'RESTART RACHA ISLAND HYBRID',
  registration_opens_at timestamptz not null default '2026-09-28 12:00:00+07',
  registration_closes_at timestamptz,
  installment_2_due_at timestamptz not null default '2026-10-15 23:59:59+07',
  installment_3_due_at timestamptz not null default '2026-10-31 23:59:59+07',
  deposit_thb integer not null default 3000 check (deposit_thb > 0),
  second_thb integer not null default 2000 check (second_thb > 0),
  bank_name text,
  account_name text,
  account_number text,
  promptpay_name text,
  promptpay_number text,
  poster_url text,
  max_slip_mb integer not null default 10 check (max_slip_mb between 1 and 10),
  updated_at timestamptz not null default now()
);

create table if not exists public.rrih_packages (
  code text primary key,
  name_th text not null,
  name_en text,
  name_zh text,
  name_ru text,
  name_ja text,
  price_thb integer not null check (price_thb >= 5000),
  runner_count smallint not null check (runner_count between 1 and 2),
  follower_count smallint not null default 0 check (follower_count between 0 and 1),
  room_type text,
  breakfast boolean not null default false,
  after_party boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.rrih_shirt_sizes (
  code text primary key,
  label text not null,
  active boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists public.rrih_admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'ADMIN' check (role in ('ADMIN', 'VIEWER')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.rrih_registrations (
  id uuid primary key default gen_random_uuid(),
  registration_code text not null unique,
  package_code text not null references public.rrih_packages(code),
  package_name_snapshot text not null,
  package_price_thb integer not null check (package_price_thb > 0),
  payment_plan text not null check (payment_plan in ('FULL','INSTALLMENT')),
  access_secret_hash text not null,
  language text not null default 'th' check (language in ('th','en','zh','ru','ja')),
  consent_privacy_at timestamptz not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','CANCELLED')),
  submitted_at timestamptz not null default now()
);

create table if not exists public.rrih_participants (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.rrih_registrations(id),
  role text not null check (role in ('RUNNER','FOLLOWER')),
  runner_no smallint,
  prefix text,
  first_name text not null,
  last_name text not null,
  id_document text,
  id_normalized text generated always as (public.rrih_normalize_id(id_document)) stored,
  address text,
  phone text,
  emergency_phone text,
  emergency_relation text,
  blood_group text check (blood_group in ('A','B','AB','O')),
  shirt_size text,
  constraint rrih_participant_role_no check (
    (role = 'RUNNER' and runner_no between 1 and 2 and id_document is not null)
    or (role = 'FOLLOWER' and runner_no is null)
  ),
  unique (registration_id, id),
  unique (registration_id, runner_no)
);
create unique index if not exists rrih_runner_id_unique
  on public.rrih_participants (id_normalized) where role = 'RUNNER';
create index if not exists rrih_participants_registration_idx
  on public.rrih_participants (registration_id);

create table if not exists public.rrih_beneficiaries (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null,
  runner_id uuid not null,
  full_name text not null,
  id_document text not null,
  id_normalized text generated always as (public.rrih_normalize_id(id_document)) stored,
  relationship text not null,
  percentage numeric(5,2) not null check (percentage > 0 and percentage <= 100),
  foreign key (registration_id, runner_id)
    references public.rrih_participants (registration_id, id),
  unique (registration_id, id_normalized)
);
create index if not exists rrih_beneficiaries_runner_idx
  on public.rrih_beneficiaries (runner_id);

create table if not exists public.rrih_installments (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.rrih_registrations(id),
  installment_no smallint not null check (installment_no between 1 and 3),
  amount_due_thb integer not null check (amount_due_thb > 0),
  due_at timestamptz not null,
  status text not null default 'PENDING' check (status in ('PENDING','PENDING_REVIEW','PAID')),
  paid_at timestamptz,
  unique (registration_id, installment_no)
);
create index if not exists rrih_installments_registration_idx
  on public.rrih_installments (registration_id);
create index if not exists rrih_installments_review_idx
  on public.rrih_installments (status, due_at);

create table if not exists public.rrih_payment_attempts (
  id uuid primary key default gen_random_uuid(),
  installment_id uuid not null references public.rrih_installments(id),
  amount_claimed_thb integer not null check (amount_claimed_thb > 0),
  slip_path text not null,
  status text not null default 'PENDING_REVIEW'
    check (status in ('PENDING_REVIEW','APPROVED','REJECTED')),
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  admin_note text
);
create index if not exists rrih_attempt_installment_idx
  on public.rrih_payment_attempts (installment_id);
create unique index if not exists rrih_one_pending_attempt
  on public.rrih_payment_attempts (installment_id) where status = 'PENDING_REVIEW';
create unique index if not exists rrih_one_approved_attempt
  on public.rrih_payment_attempts (installment_id) where status = 'APPROVED';

create table if not exists public.rrih_rate_limits (
  action text not null,
  client_key text not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  primary key (action, client_key, window_start)
);

insert into public.rrih_settings (id, bank_name, promptpay_name, promptpay_number)
values (1, 'ธนาคารกสิกรไทย', 'คุณณริณทิพย์ หวานดี', '0693309697')
on conflict (id) do nothing;

insert into public.rrih_packages
  (code,name_th,name_en,name_zh,name_ru,name_ja,price_thb,runner_count,follower_count,room_type,breakfast,after_party,sort_order)
values
  ('SOLO','แข่งขัน 1 ท่าน','Solo entry','单人参赛','Один участник','個人参加',7000,1,0,null,false,false,1),
  ('SHARED_2','จอยห้อง 1 ห้อง 2 ผู้แข่งขัน','Shared room · 2 runners','双人参赛·合住房间','Два участника · общая комната','2名参加・相部屋',14000,2,0,'SHARED',true,true,2),
  ('RUNNER_FOLLOWER','แข่งขัน 1 ท่าน + ผู้ติดตาม','Runner + companion','参赛者+随行人员','Участник + сопровождающий','参加者＋同伴者',10000,1,1,'SHARED',true,true,3),
  ('SOLO_ROOM','แข่งขัน 1 ท่าน พักเดี่ยว','Solo runner · private room','单人参赛·单人房','Один участник · отдельная комната','個人参加・個室',8000,1,0,'SINGLE',true,true,4),
  ('PAIR_DOUBLE','สมัครคู่ 2 ท่าน พักเตียงใหญ่','Pair · double bed','双人参赛·大床房','Пара · двуспальная кровать','2名参加・ダブルベッド',13000,2,0,'DOUBLE',true,true,5)
on conflict (code) do nothing;

insert into public.rrih_shirt_sizes (code,label,sort_order) values
  ('XS','XS',1),('S','S',2),('M','M',3),('L','L',4),('XL','XL',5),('2XL','2XL',6),('3XL','3XL',7)
on conflict (code) do nothing;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('rrih-slips','rrih-slips',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

create or replace function public.rrih_limit_request(
  p_action text, p_key text, p_limit integer default 8)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare n integer;
begin
  insert into public.rrih_rate_limits(action,client_key,window_start,request_count)
  values (p_action,p_key,date_bin('10 minutes',now(),'2000-01-01'::timestamptz),1)
  on conflict (action,client_key,window_start) do update
  set request_count = public.rrih_rate_limits.request_count + 1
  returning request_count into n;
  return n <= p_limit;
end $$;

create or replace function public.rrih_create_registration(p_data jsonb,p_secret_hash text,p_slip_path text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  cfg public.rrih_settings%rowtype;
  pkg public.rrih_packages%rowtype;
  rid uuid := gen_random_uuid();
  runner_ids uuid[] := array[]::uuid[];
  item jsonb;
  bene jsonb;
  idx integer := 0;
  plan text := p_data->>'payment_plan';
  first_amount integer;
  first_inst uuid;
  new_runner_id uuid;
  price integer;
  code text := 'RRIH-' || to_char(clock_timestamp() at time zone 'Asia/Bangkok','YYMMDDHH24MISS')
    || '-' || upper(substr(md5(gen_random_uuid()::text),1,8));
begin
  select * into strict cfg from public.rrih_settings where id=1;
  select * into pkg from public.rrih_packages where code=p_data->>'package_code' and active=true;
  if not found or now()<cfg.registration_opens_at or
     (cfg.registration_closes_at is not null and now()>cfg.registration_closes_at) then
    raise exception 'REGISTRATION_CLOSED';
  end if;
  if plan not in ('FULL','INSTALLMENT') or coalesce((p_data->>'consent_privacy')::boolean,false) is not true
     or length(p_secret_hash)<>64 or length(p_slip_path)<5 then
    raise exception 'INVALID_REGISTRATION';
  end if;
  if plan='INSTALLMENT' and (now()>cfg.installment_2_due_at or pkg.price_thb<=cfg.deposit_thb+cfg.second_thb) then
    raise exception 'INSTALLMENTS_UNAVAILABLE';
  end if;
  if jsonb_typeof(p_data->'runners')<>'array' or jsonb_array_length(p_data->'runners')<>pkg.runner_count or
     jsonb_typeof(p_data->'followers')<>'array' or jsonb_array_length(p_data->'followers')<>pkg.follower_count then
    raise exception 'PARTICIPANT_COUNT_MISMATCH';
  end if;
  price := pkg.price_thb;
  insert into public.rrih_registrations
    (id,registration_code,package_code,package_name_snapshot,package_price_thb,payment_plan,access_secret_hash,language,consent_privacy_at)
  values (rid,code,pkg.code,pkg.name_th,price,plan,p_secret_hash,
    coalesce(p_data->>'language','th'),now());
  for item in select value from jsonb_array_elements(p_data->'runners') loop
    idx := idx + 1;
    if length(trim(coalesce(item->>'first_name','')))=0 or length(trim(coalesce(item->>'last_name','')))=0 or
       length(public.rrih_normalize_id(coalesce(item->>'id_document','')))<5 or
       length(trim(coalesce(item->>'phone','')))=0 or length(trim(coalesce(item->>'address','')))=0 or
       length(trim(coalesce(item->>'emergency_phone','')))=0 or
       length(trim(coalesce(item->>'emergency_relation','')))=0 or
       coalesce(item->>'blood_group','') not in ('A','B','AB','O') or
       not exists (select 1 from public.rrih_shirt_sizes where code=item->>'shirt_size' and active) then
      raise exception 'INVALID_RUNNER';
    end if;
    insert into public.rrih_participants
      (registration_id,role,runner_no,prefix,first_name,last_name,id_document,address,phone,
       emergency_phone,emergency_relation,blood_group,shirt_size)
    values (rid,'RUNNER',idx,item->>'prefix',trim(item->>'first_name'),trim(item->>'last_name'),
      trim(item->>'id_document'),item->>'address',item->>'phone',item->>'emergency_phone',
      item->>'emergency_relation',item->>'blood_group',item->>'shirt_size')
    returning id into new_runner_id;
    runner_ids := array_append(runner_ids,new_runner_id);
  end loop;
  for item in select value from jsonb_array_elements(p_data->'followers') loop
    if length(trim(coalesce(item->>'first_name','')))=0 or length(trim(coalesce(item->>'last_name','')))=0 then
      raise exception 'INVALID_FOLLOWER';
    end if;
    insert into public.rrih_participants
      (registration_id,role,first_name,last_name,id_document,phone)
    values (rid,'FOLLOWER',trim(item->>'first_name'),trim(item->>'last_name'),
      nullif(trim(coalesce(item->>'id_document','')),''),item->>'phone');
  end loop;
  if jsonb_typeof(p_data->'beneficiaries')<>'array' then raise exception 'BENEFICIARIES_REQUIRED'; end if;
  for bene in select value from jsonb_array_elements(p_data->'beneficiaries') loop
    idx := (bene->>'runner_no')::integer;
    if idx<1 or idx>pkg.runner_count or length(trim(coalesce(bene->>'full_name','')))=0 or
       length(public.rrih_normalize_id(coalesce(bene->>'id_document','')))<5 or
       length(trim(coalesce(bene->>'relationship','')))=0 or
       exists (select 1 from public.rrih_participants
               where registration_id=rid and role='RUNNER'
                 and id_normalized=public.rrih_normalize_id(bene->>'id_document')) then
      raise exception 'INVALID_BENEFICIARY';
    end if;
    insert into public.rrih_beneficiaries(registration_id,runner_id,full_name,id_document,relationship,percentage)
    values (rid,runner_ids[idx],trim(bene->>'full_name'),trim(bene->>'id_document'),
      trim(bene->>'relationship'),(bene->>'percentage')::numeric);
  end loop;
  if exists (
    select 1 from unnest(runner_ids) as r(id)
    left join public.rrih_beneficiaries b on b.runner_id=r.id
    group by r.id having coalesce(sum(b.percentage),0)<>100
  ) then raise exception 'BENEFICIARY_TOTAL_NOT_100'; end if;

  first_amount := case when plan='FULL' then price else cfg.deposit_thb end;
  insert into public.rrih_installments(registration_id,installment_no,amount_due_thb,due_at,status)
  values (rid,1,first_amount,now(),'PENDING_REVIEW') returning id into first_inst;
  if plan='INSTALLMENT' then
    insert into public.rrih_installments(registration_id,installment_no,amount_due_thb,due_at)
    values (rid,2,cfg.second_thb,cfg.installment_2_due_at),
           (rid,3,price-cfg.deposit_thb-cfg.second_thb,cfg.installment_3_due_at);
  end if;
  insert into public.rrih_payment_attempts(installment_id,amount_claimed_thb,slip_path)
  values (first_inst,first_amount,p_slip_path);
  return jsonb_build_object('registration_code',code,'registration_id',rid,
    'amount_due_thb',first_amount,'status','PENDING_REVIEW');
end $$;

create or replace function public.rrih_submit_next(p_registration_id uuid,p_installment_id uuid,p_slip_path text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare target public.rrih_installments%rowtype; first_unpaid uuid;
begin
  perform 1 from public.rrih_registrations where id=p_registration_id and status='ACTIVE' for update;
  if not found then raise exception 'REGISTRATION_NOT_FOUND'; end if;
  select id into first_unpaid from public.rrih_installments
    where registration_id=p_registration_id and status<>'PAID'
    order by installment_no limit 1;
  if first_unpaid is distinct from p_installment_id or length(p_slip_path)<5 then
    raise exception 'INSTALLMENT_NOT_NEXT';
  end if;
  select * into target from public.rrih_installments where id=p_installment_id for update;
  if target.status<>'PENDING' then raise exception 'INSTALLMENT_NOT_OPEN'; end if;
  insert into public.rrih_payment_attempts(installment_id,amount_claimed_thb,slip_path)
  values (target.id,target.amount_due_thb,p_slip_path);
  update public.rrih_installments set status='PENDING_REVIEW' where id=target.id;
  return jsonb_build_object('installment_no',target.installment_no,'status','PENDING_REVIEW');
end $$;

create or replace function public.rrih_review_attempt(p_attempt_id uuid,p_admin_id uuid,p_approve boolean,p_note text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare attempt public.rrih_payment_attempts%rowtype; target public.rrih_installments%rowtype;
begin
  if not exists (select 1 from public.rrih_admin_users
                 where user_id=p_admin_id and active and role='ADMIN') then
    raise exception 'FORBIDDEN';
  end if;
  select * into attempt from public.rrih_payment_attempts where id=p_attempt_id;
  if not found then raise exception 'ATTEMPT_NOT_FOUND'; end if;
  select * into target from public.rrih_installments where id=attempt.installment_id for update;
  if attempt.status<>'PENDING_REVIEW' or target.status<>'PENDING_REVIEW' then
    raise exception 'ALREADY_REVIEWED';
  end if;
  if p_approve and attempt.amount_claimed_thb<>target.amount_due_thb then
    raise exception 'AMOUNT_MISMATCH';
  end if;
  update public.rrih_payment_attempts
  set status=case when p_approve then 'APPROVED' else 'REJECTED' end,
      reviewed_by=p_admin_id,reviewed_at=now(),admin_note=nullif(trim(p_note),'')
  where id=attempt.id;
  update public.rrih_installments
  set status=case when p_approve then 'PAID' else 'PENDING' end,
      paid_at=case when p_approve then now() else null end
  where id=target.id;
  return jsonb_build_object('installment_id',target.id,'status',
    case when p_approve then 'PAID' else 'PENDING' end);
end $$;

-- API access is deliberately denied by default. The Edge Function validates callers,
-- then uses a server-only key to call the atomic security-invoker functions above.
do $$ declare tab text; begin
  foreach tab in array array['rrih_settings','rrih_packages','rrih_shirt_sizes','rrih_admin_users',
    'rrih_registrations','rrih_participants','rrih_beneficiaries','rrih_installments',
    'rrih_payment_attempts','rrih_rate_limits'] loop
    execute format('alter table public.%I enable row level security',tab);
    execute format('revoke all on public.%I from anon, authenticated',tab);
    execute format('grant all on public.%I to service_role',tab);
  end loop;
end $$;
revoke all on function public.rrih_create_registration(jsonb,text,text) from public,anon,authenticated;
revoke all on function public.rrih_submit_next(uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.rrih_review_attempt(uuid,uuid,boolean,text) from public,anon,authenticated;
revoke all on function public.rrih_limit_request(text,text,integer) from public,anon,authenticated;
grant execute on function public.rrih_create_registration(jsonb,text,text) to service_role;
grant execute on function public.rrih_submit_next(uuid,uuid,text) to service_role;
grant execute on function public.rrih_review_attempt(uuid,uuid,boolean,text) to service_role;
grant execute on function public.rrih_limit_request(text,text,integer) to service_role;
