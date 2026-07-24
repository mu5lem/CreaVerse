
-- 1) Separate admin membership table to eliminate any RLS recursion path through profiles
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own admin flag" ON public.admin_users;
CREATE POLICY "Users view own admin flag" ON public.admin_users
  FOR SELECT TO authenticated USING (user_id = auth.uid());

INSERT INTO public.admin_users (user_id)
  SELECT id FROM public.profiles WHERE role = 'admin'
ON CONFLICT DO NOTHING;

-- 2) is_admin now reads admin_users — no path back through profiles
CREATE OR REPLACE FUNCTION public.is_admin(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = _uid)
$$;

-- 3) Keep admin_users in sync when an admin promotes/demotes a user
CREATE OR REPLACE FUNCTION public.admin_set_user_status(target_user_id uuid, new_role text, new_is_suspended boolean)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if not public.is_admin(v_uid) then raise exception 'Not authorized'; end if;
  if new_role not in ('student','teacher','admin') then raise exception 'Invalid role'; end if;

  perform set_config('creaverse.bypass_profile_guard', 'on', true);
  update public.profiles
     set role = new_role, is_suspended = new_is_suspended
   where id = target_user_id;
  perform set_config('creaverse.bypass_profile_guard', 'off', true);

  if new_role = 'admin' then
    insert into public.admin_users(user_id) values (target_user_id) on conflict do nothing;
  else
    delete from public.admin_users where user_id = target_user_id;
  end if;

  return json_build_object('success', true);
end;
$$;

-- 4) Add full_name to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;

-- 5) Per-class chat
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_code text NOT NULL REFERENCES public.classes(class_code) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_messages_class_created_idx
  ON public.chat_messages(class_code, created_at);

GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Class members view chat" ON public.chat_messages;
CREATE POLICY "Class members view chat" ON public.chat_messages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.classes c
            WHERE c.class_code = chat_messages.class_code AND c.teacher_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.enrollments e
               WHERE e.class_code = chat_messages.class_code AND e.student_id = auth.uid())
  );

DROP POLICY IF EXISTS "Class members send chat" ON public.chat_messages;
CREATE POLICY "Class members send chat" ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid() AND (
      EXISTS (SELECT 1 FROM public.classes c
              WHERE c.class_code = chat_messages.class_code AND c.teacher_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.enrollments e
                 WHERE e.class_code = chat_messages.class_code AND e.student_id = auth.uid())
    )
  );

-- Enable realtime (idempotent)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
