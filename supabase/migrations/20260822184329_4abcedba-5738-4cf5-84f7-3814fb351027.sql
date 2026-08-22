ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key
  ON public.profiles (lower(username)) WHERE username IS NOT NULL;

-- One-time backfill: anyone already confirmed in auth, or already a teacher/admin, stays verified.
UPDATE public.profiles p
   SET email_verified = true
  FROM auth.users u
 WHERE u.id = p.id
   AND (u.email_confirmed_at IS NOT NULL OR p.role IN ('teacher','admin'));

UPDATE public.profiles SET email_verified = true WHERE role IN ('teacher','admin') AND email_verified = false;

CREATE TABLE IF NOT EXISTS public.teacher_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_name text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.teacher_requests TO authenticated;
GRANT UPDATE ON public.teacher_requests TO authenticated;
GRANT ALL ON public.teacher_requests TO service_role;

ALTER TABLE public.teacher_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert their own teacher requests"
  ON public.teacher_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read their own teacher requests"
  ON public.teacher_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins update teacher requests"
  ON public.teacher_requests FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_teacher_requests_touch
  BEFORE UPDATE ON public.teacher_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS teacher_requests_status_idx ON public.teacher_requests (status, created_at DESC);