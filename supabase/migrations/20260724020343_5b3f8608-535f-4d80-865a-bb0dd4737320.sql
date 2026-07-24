
-- Add answers column for quiz submissions
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS answers jsonb;

-- Enrollment requests (leave / reactivate)
CREATE TABLE IF NOT EXISTS public.enrollment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_code text NOT NULL REFERENCES public.classes(class_code) ON UPDATE CASCADE ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('leave','reactivate')),
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied')),
  decided_by uuid REFERENCES public.profiles(id),
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS enrollment_requests_class_idx ON public.enrollment_requests(class_code, status);
CREATE INDEX IF NOT EXISTS enrollment_requests_student_idx ON public.enrollment_requests(student_id);
-- Only one pending request of a given kind per (student, class)
CREATE UNIQUE INDEX IF NOT EXISTS enrollment_requests_unique_pending
  ON public.enrollment_requests(student_id, class_code, kind)
  WHERE status = 'pending';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollment_requests TO authenticated;
GRANT ALL ON public.enrollment_requests TO service_role;

ALTER TABLE public.enrollment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students insert own enrollment requests" ON public.enrollment_requests
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students view own enrollment requests" ON public.enrollment_requests
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Teachers view requests for their classes" ON public.enrollment_requests
  FOR SELECT TO authenticated
  USING (public.is_class_teacher(auth.uid(), class_code));

CREATE POLICY "Teachers update requests for their classes" ON public.enrollment_requests
  FOR UPDATE TO authenticated
  USING (public.is_class_teacher(auth.uid(), class_code))
  WITH CHECK (public.is_class_teacher(auth.uid(), class_code));

CREATE POLICY "Admins view all enrollment requests" ON public.enrollment_requests
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_enrollment_requests_touch ON public.enrollment_requests;
CREATE TRIGGER trg_enrollment_requests_touch BEFORE UPDATE ON public.enrollment_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Notify student when their suspension status changes
CREATE OR REPLACE FUNCTION public.notify_enrollment_suspended() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_title text;
BEGIN
  IF NEW.suspended IS DISTINCT FROM OLD.suspended THEN
    SELECT title INTO v_title FROM public.classes WHERE class_code = NEW.class_code;
    IF NEW.suspended THEN
      INSERT INTO public.notifications(user_id, type, message, link)
      VALUES (NEW.student_id, 'suspension',
        'You were suspended from ' || COALESCE(v_title, NEW.class_code) || '. You can request reactivation.',
        '/student/dashboard');
    ELSE
      INSERT INTO public.notifications(user_id, type, message, link)
      VALUES (NEW.student_id, 'suspension',
        'You have been reactivated in ' || COALESCE(v_title, NEW.class_code) || '.',
        '/student/class/' || NEW.class_code);
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_enrollment_suspended ON public.enrollments;
CREATE TRIGGER trg_notify_enrollment_suspended AFTER UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.notify_enrollment_suspended();

-- Notify teacher when a student submits a request
CREATE OR REPLACE FUNCTION public.notify_enrollment_request() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_teacher uuid; v_student_email text; v_msg text;
BEGIN
  SELECT teacher_id INTO v_teacher FROM public.classes WHERE class_code = NEW.class_code;
  SELECT email INTO v_student_email FROM public.profiles WHERE id = NEW.student_id;
  IF v_teacher IS NOT NULL THEN
    v_msg := COALESCE(v_student_email, 'A student') ||
      CASE WHEN NEW.kind = 'leave' THEN ' requested to leave ' ELSE ' requested reactivation in ' END ||
      NEW.class_code;
    INSERT INTO public.notifications(user_id, type, message, link)
    VALUES (v_teacher, 'enrollment_request', v_msg,
      '/teacher/class/' || NEW.class_code);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_enrollment_request ON public.enrollment_requests;
CREATE TRIGGER trg_notify_enrollment_request AFTER INSERT ON public.enrollment_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_enrollment_request();
