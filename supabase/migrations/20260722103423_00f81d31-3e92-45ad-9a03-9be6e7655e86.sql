
-- 1) Promote first admin
DO $$
DECLARE v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM public.profiles WHERE email='mmuslimk09@gmail.com';
  IF v_uid IS NOT NULL THEN
    PERFORM set_config('creaverse.bypass_profile_guard','on',true);
    UPDATE public.profiles SET role='admin', is_suspended=false WHERE id=v_uid;
    PERFORM set_config('creaverse.bypass_profile_guard','off',true);
    INSERT INTO public.admin_users(user_id) VALUES (v_uid) ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 2) invite_codes: grants + RLS for admins
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invite_codes TO authenticated;
GRANT ALL ON public.invite_codes TO service_role;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view invite codes" ON public.invite_codes;
CREATE POLICY "Admins can view invite codes" ON public.invite_codes
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can create invite codes" ON public.invite_codes;
CREATE POLICY "Admins can create invite codes" ON public.invite_codes
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) AND created_by = auth.uid());

DROP POLICY IF EXISTS "Admins can update invite codes" ON public.invite_codes;
CREATE POLICY "Admins can update invite codes" ON public.invite_codes
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete invite codes" ON public.invite_codes;
CREATE POLICY "Admins can delete invite codes" ON public.invite_codes
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));
