
create or replace function public.profiles_guard_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bypass text;
begin
  -- Trusted SECURITY DEFINER functions set this local GUC to bypass the guard.
  begin
    v_bypass := current_setting('creaverse.bypass_profile_guard', true);
  exception when others then
    v_bypass := null;
  end;
  if v_bypass = 'on' then
    return new;
  end if;

  if auth.uid() is null then
    return new;
  end if;
  if public.is_admin(auth.uid()) then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'Not allowed to change role directly';
  end if;
  if new.is_suspended is distinct from old.is_suspended then
    raise exception 'Not allowed to change suspension status';
  end if;
  return new;
end;
$$;

create or replace function public.request_role_upgrade(requested_role text, invite_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.invite_codes%rowtype;
begin
  if v_uid is null then
    return json_build_object('success', false, 'error', 'Not authenticated');
  end if;
  if requested_role <> 'teacher' then
    return json_build_object('success', false, 'error', 'Only teacher upgrades are supported');
  end if;

  select * into v_row
  from public.invite_codes
  where code = invite_code
    and role = requested_role
    and active = true
    and (expires_at is null or expires_at > now())
    and uses < max_uses
  for update;

  if not found then
    return json_build_object('success', false, 'error', 'Invalid or expired invite code');
  end if;

  update public.invite_codes set uses = uses + 1 where id = v_row.id;

  perform set_config('creaverse.bypass_profile_guard', 'on', true);
  update public.profiles set role = 'teacher' where id = v_uid;
  perform set_config('creaverse.bypass_profile_guard', 'off', true);

  return json_build_object('success', true, 'role', 'teacher');
end;
$$;

create or replace function public.admin_set_user_status(
  target_user_id uuid,
  new_role text,
  new_is_suspended boolean
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_admin(v_uid) then
    raise exception 'Not authorized';
  end if;
  if new_role not in ('student','teacher','admin') then
    raise exception 'Invalid role';
  end if;

  perform set_config('creaverse.bypass_profile_guard', 'on', true);
  update public.profiles
     set role = new_role,
         is_suspended = new_is_suspended
   where id = target_user_id;
  perform set_config('creaverse.bypass_profile_guard', 'off', true);

  return json_build_object('success', true);
end;
$$;
