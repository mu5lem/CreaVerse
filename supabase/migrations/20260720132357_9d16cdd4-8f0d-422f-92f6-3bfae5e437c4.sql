-- Allow authenticated users to look up any class (needed to enroll via class code)
CREATE POLICY "Authenticated can lookup classes" ON public.classes
  FOR SELECT TO authenticated USING (true);

-- Promote Muhammad Muslim to admin
INSERT INTO public.admin_users(user_id) VALUES ('ed4b286b-16ac-46bf-936a-a1a638530980')
  ON CONFLICT DO NOTHING;

SELECT set_config('creaverse.bypass_profile_guard', 'on', true);
UPDATE public.profiles SET role = 'admin' WHERE id = 'ed4b286b-16ac-46bf-936a-a1a638530980';
SELECT set_config('creaverse.bypass_profile_guard', 'off', true);