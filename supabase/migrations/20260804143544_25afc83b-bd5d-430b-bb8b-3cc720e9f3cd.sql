-- 1) Notifications: no arbitrary inserts by signed-in users
DROP POLICY IF EXISTS "any auth insert notifications" ON public.notifications;
CREATE POLICY "own notifications insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2) Remove any seeded/hardcoded invite codes
DELETE FROM public.invite_codes WHERE code = 'TEACH-CREAVERSE-2026';
UPDATE public.invite_codes SET active = false WHERE active = true AND created_by IS NULL;

-- 3) Drop client-bypassable WhatsApp verification columns
ALTER TABLE public.profiles DROP COLUMN IF EXISTS wa_verify_code;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone_verified;

-- 4) Lock down SECURITY DEFINER functions
-- Trigger-only functions: not callable by anyone through the API
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.profiles_guard_privileged_columns() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_assignment_posted() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_enrollment_request() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_enrollment_suspended() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_submission_created() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_submission_graded() FROM PUBLIC, anon, authenticated;

-- User-facing RPCs: signed-in users only, never anonymous
REVOKE ALL ON FUNCTION public.join_class(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_class(text) TO authenticated;

REVOKE ALL ON FUNCTION public.request_role_upgrade(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_role_upgrade(text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_set_user_status(uuid, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_status(uuid, text, boolean) TO authenticated;

REVOKE ALL ON FUNCTION public.user_deactivate_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_deactivate_account() TO authenticated;

-- RLS helper predicates: needed by policies for signed-in users only
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.is_class_teacher(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_class_teacher(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.is_enrolled(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_enrolled(uuid, text) TO authenticated;