-- Installment plan: 3,000 THB first, then split the balance evenly, rounding installment 2 to 100 THB.
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
  second_amount integer;
  first_inst uuid;
  new_runner_id uuid;
  price integer;
  new_code text := 'RRIH-' || to_char(clock_timestamp() at time zone 'Asia/Bangkok','YYMMDDHH24MISS')
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
  price := pkg.price_thb;
  first_amount := case when plan='FULL' then price else 3000 end;
  second_amount := ((price - first_amount) / 200) * 100;
  if plan='INSTALLMENT' and (now()>cfg.installment_2_due_at or price<=first_amount+second_amount) then
    raise exception 'INSTALLMENTS_UNAVAILABLE';
  end if;
  if jsonb_typeof(p_data->'runners')<>'array' or jsonb_array_length(p_data->'runners')<>pkg.runner_count or
     jsonb_typeof(p_data->'followers')<>'array' or jsonb_array_length(p_data->'followers')<>pkg.follower_count then
    raise exception 'PARTICIPANT_COUNT_MISMATCH';
  end if;
  insert into public.rrih_registrations
    (id,registration_code,package_code,package_name_snapshot,package_price_thb,payment_plan,access_secret_hash,language,consent_privacy_at)
  values (rid,new_code,pkg.code,pkg.name_th,price,plan,p_secret_hash,
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

  insert into public.rrih_installments(registration_id,installment_no,amount_due_thb,due_at,status)
  values (rid,1,first_amount,now(),'PENDING_REVIEW') returning id into first_inst;
  if plan='INSTALLMENT' then
    insert into public.rrih_installments(registration_id,installment_no,amount_due_thb,due_at)
    values (rid,2,second_amount,cfg.installment_2_due_at),
           (rid,3,price-first_amount-second_amount,cfg.installment_3_due_at);
  end if;
  insert into public.rrih_payment_attempts(installment_id,amount_claimed_thb,slip_path)
  values (first_inst,first_amount,p_slip_path);
  return jsonb_build_object('registration_code',new_code,'registration_id',rid,
    'amount_due_thb',first_amount,'status','PENDING_REVIEW');
end $$;

