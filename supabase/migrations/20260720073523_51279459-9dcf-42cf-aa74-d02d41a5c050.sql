
-- ============================================================================
-- CreaVerse Phase 1 schema
-- BOOTSTRAP THE FIRST ADMIN:
--   1. Sign up normally through the app (creates a 'student' profile).
--   2. In the Cloud SQL editor, run ONCE:
--        update public.profiles set role = 'admin' where email = 'you@example.com';
-- ============================================================================

-- TABLES ----------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  phone text,
  role text not null default 'student' check (role in ('student','teacher','admin')),
  current_streak int not null default 0,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  grade text,
  title text not null,
  description text,
  class_code text not null unique,
  created_at timestamptz not null default now()
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  class_code text not null references public.classes(class_code) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique (student_id, class_code)
);

create table public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  role text not null check (role = 'teacher'),
  max_uses int not null default 1,
  uses int not null default 0,
  created_by uuid,
  expires_at timestamptz,
  active boolean not null default true
);

-- GRANTS ----------------------------------------------------------------------
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

grant select, insert, update, delete on public.classes to authenticated;
grant all on public.classes to service_role;

grant select, insert, delete on public.enrollments to authenticated;
grant all on public.enrollments to service_role;

grant all on public.invite_codes to service_role;
-- No authenticated grant on invite_codes: only SECURITY DEFINER fns read/write it.

-- RLS ENABLE ------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.enrollments enable row level security;
alter table public.invite_codes enable row level security;

-- HELPERS ---------------------------------------------------------------------
create or replace function public.is_admin(_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = _uid and role = 'admin')
$$;

create or replace function public.profiles_guard_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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

create trigger profiles_guard_privileged
  before update on public.profiles
  for each row execute function public.profiles_guard_privileged_columns();

-- POLICIES: profiles ----------------------------------------------------------
create policy "Users view own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "Admins view all profiles"
  on public.profiles for select to authenticated
  using (public.is_admin(auth.uid()));

create policy "Users insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- POLICIES: classes -----------------------------------------------------------
create policy "Teachers manage own classes"
  on public.classes for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

create policy "Students view enrolled classes"
  on public.classes for select to authenticated
  using (
    exists (
      select 1 from public.enrollments e
      where e.student_id = auth.uid()
        and e.class_code = classes.class_code
    )
  );

create policy "Admins view all classes"
  on public.classes for select to authenticated
  using (public.is_admin(auth.uid()));

-- POLICIES: enrollments -------------------------------------------------------
create policy "Students insert own enrollment"
  on public.enrollments for insert to authenticated
  with check (student_id = auth.uid());

create policy "Students view own enrollments"
  on public.enrollments for select to authenticated
  using (student_id = auth.uid());

create policy "Teachers view enrollments in their classes"
  on public.enrollments for select to authenticated
  using (
    exists (
      select 1 from public.classes c
      where c.class_code = enrollments.class_code
        and c.teacher_id = auth.uid()
    )
  );

create policy "Admins view all enrollments"
  on public.enrollments for select to authenticated
  using (public.is_admin(auth.uid()));

-- invite_codes: no policies -> no direct access via Data API.

-- FUNCTIONS -------------------------------------------------------------------
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
  update public.profiles set role = 'teacher' where id = v_uid;

  return json_build_object('success', true, 'role', 'teacher');
end;
$$;

revoke all on function public.request_role_upgrade(text, text) from public;
grant execute on function public.request_role_upgrade(text, text) to authenticated;

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

  update public.profiles
     set role = new_role,
         is_suspended = new_is_suspended
   where id = target_user_id;

  return json_build_object('success', true);
end;
$$;

revoke all on function public.admin_set_user_status(uuid, text, boolean) from public;
grant execute on function public.admin_set_user_status(uuid, text, boolean) to authenticated;
