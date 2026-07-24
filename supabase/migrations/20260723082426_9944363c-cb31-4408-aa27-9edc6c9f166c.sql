ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS assignment_kind text NOT NULL DEFAULT 'plain',
  ADD COLUMN IF NOT EXISTS total_marks numeric;

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS obtained_marks numeric,
  ADD COLUMN IF NOT EXISTS percentage numeric;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS theme_preference text NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{"assignment":true,"submission":true,"grade":true}'::jsonb,
  ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;

CREATE TABLE IF NOT EXISTS public.assignment_link_opens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  opened_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignment_link_opens TO authenticated;
GRANT ALL ON public.assignment_link_opens TO service_role;
ALTER TABLE public.assignment_link_opens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students manage own link opens" ON public.assignment_link_opens;
CREATE POLICY "Students manage own link opens"
ON public.assignment_link_opens
FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());
DROP POLICY IF EXISTS "Teachers view link opens for own classes" ON public.assignment_link_opens;
CREATE POLICY "Teachers view link opens for own classes"
ON public.assignment_link_opens
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.assignments a
    JOIN public.classes c ON c.class_code = a.class_code
    WHERE a.id = assignment_link_opens.assignment_id
      AND c.teacher_id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_class_code ON public.classes(class_code);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_code ON public.enrollments(class_code);
CREATE INDEX IF NOT EXISTS idx_assignments_class_code ON public.assignments(class_code);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON public.submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_class_code ON public.chat_messages(class_code);
CREATE INDEX IF NOT EXISTS idx_mentor_messages_user_id ON public.mentor_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_assignment_link_opens_student_assignment ON public.assignment_link_opens(student_id, assignment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON public.notifications(user_id, read, created_at DESC);

CREATE OR REPLACE FUNCTION public.notify_assignment_posted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications(user_id, type, message, link)
  SELECT e.student_id,
         'assignment',
         'New assignment posted: ' || NEW.title,
         '/student/class/' || NEW.class_code
  FROM public.enrollments e
  LEFT JOIN public.profiles p ON p.id = e.student_id
  WHERE e.class_code = NEW.class_code
    AND e.suspended = false
    AND COALESCE((p.notification_preferences->>'assignment')::boolean, true) = true;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_assignment_posted ON public.assignments;
CREATE TRIGGER trg_notify_assignment_posted
AFTER INSERT ON public.assignments
FOR EACH ROW EXECUTE FUNCTION public.notify_assignment_posted();

CREATE OR REPLACE FUNCTION public.notify_submission_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_teacher uuid;
  v_title text;
  v_class text;
BEGIN
  SELECT c.teacher_id, a.title, a.class_code
    INTO v_teacher, v_title, v_class
  FROM public.assignments a
  JOIN public.classes c ON c.class_code = a.class_code
  WHERE a.id = NEW.assignment_id;

  IF v_teacher IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, type, message, link)
    SELECT v_teacher,
           'submission',
           'New submission received for: ' || COALESCE(v_title, 'Assignment'),
           '/teacher/assignment/' || NEW.assignment_id::text
    WHERE COALESCE((SELECT (notification_preferences->>'submission')::boolean FROM public.profiles WHERE id = v_teacher), true) = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_submission_created ON public.submissions;
CREATE TRIGGER trg_notify_submission_created
AFTER INSERT ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.notify_submission_created();

CREATE OR REPLACE FUNCTION public.notify_submission_graded()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_class text;
BEGIN
  IF (NEW.grade IS DISTINCT FROM OLD.grade OR NEW.feedback IS DISTINCT FROM OLD.feedback OR NEW.obtained_marks IS DISTINCT FROM OLD.obtained_marks)
     AND (NEW.grade IS NOT NULL OR NEW.feedback IS NOT NULL OR NEW.obtained_marks IS NOT NULL) THEN
    SELECT title, class_code INTO v_title, v_class FROM public.assignments WHERE id = NEW.assignment_id;
    INSERT INTO public.notifications(user_id, type, message, link)
    SELECT NEW.student_id,
           'grade',
           'Feedback posted for: ' || COALESCE(v_title, 'Assignment'),
           '/student/class/' || COALESCE(v_class, '')
    WHERE COALESCE((SELECT (notification_preferences->>'grade')::boolean FROM public.profiles WHERE id = NEW.student_id), true) = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_submission_graded ON public.submissions;
CREATE TRIGGER trg_notify_submission_graded
AFTER UPDATE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.notify_submission_graded();

CREATE OR REPLACE FUNCTION public.user_deactivate_account()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  PERFORM set_config('creaverse.bypass_profile_guard', 'on', true);
  UPDATE public.profiles
     SET deactivated_at = now(), is_suspended = true
   WHERE id = v_uid;
  PERFORM set_config('creaverse.bypass_profile_guard', 'off', true);
  RETURN json_build_object('success', true);
END;
$$;