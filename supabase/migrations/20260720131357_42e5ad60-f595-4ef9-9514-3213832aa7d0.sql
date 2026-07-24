
-- Fix classes ↔ enrollments RLS recursion via SECURITY DEFINER helpers
CREATE OR REPLACE FUNCTION public.is_class_teacher(_uid uuid, _class_code text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.classes WHERE class_code = _class_code AND teacher_id = _uid)
$$;

CREATE OR REPLACE FUNCTION public.is_enrolled(_uid uuid, _class_code text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.enrollments WHERE class_code = _class_code AND student_id = _uid)
$$;

-- Replace recursive cross-table policies
DROP POLICY IF EXISTS "Students view enrolled classes" ON public.classes;
CREATE POLICY "Students view enrolled classes" ON public.classes
  FOR SELECT USING (public.is_enrolled(auth.uid(), class_code));

DROP POLICY IF EXISTS "Teachers view enrollments in their classes" ON public.enrollments;
CREATE POLICY "Teachers view enrollments in their classes" ON public.enrollments
  FOR SELECT USING (public.is_class_teacher(auth.uid(), class_code));

DROP POLICY IF EXISTS "Students view assignments for enrolled classes" ON public.assignments;
CREATE POLICY "Students view assignments for enrolled classes" ON public.assignments
  FOR SELECT USING (public.is_enrolled(auth.uid(), class_code));

DROP POLICY IF EXISTS "Teachers manage assignments for own classes" ON public.assignments;
CREATE POLICY "Teachers manage assignments for own classes" ON public.assignments
  FOR ALL USING (public.is_class_teacher(auth.uid(), class_code))
  WITH CHECK (public.is_class_teacher(auth.uid(), class_code));

DROP POLICY IF EXISTS "Class members view chat" ON public.chat_messages;
CREATE POLICY "Class members view chat" ON public.chat_messages
  FOR SELECT USING (
    public.is_class_teacher(auth.uid(), class_code) OR public.is_enrolled(auth.uid(), class_code)
  );

DROP POLICY IF EXISTS "Class members send chat" ON public.chat_messages;
CREATE POLICY "Class members send chat" ON public.chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND (
      public.is_class_teacher(auth.uid(), class_code) OR public.is_enrolled(auth.uid(), class_code)
    )
  );

-- Lock down SECURITY DEFINER function execution (fix scanner warnings)
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_class_teacher(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_enrolled(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.request_role_upgrade(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_user_status(uuid, text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.profiles_guard_privileged_columns() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_class_teacher(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_enrolled(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_role_upgrade(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_status(uuid, text, boolean) TO authenticated;

-- Seed a teacher invite code the user can share
INSERT INTO public.invite_codes (code, role, active, max_uses, uses)
VALUES ('TEACH-CREAVERSE-2026', 'teacher', true, 50, 0)
ON CONFLICT (code) DO NOTHING;
