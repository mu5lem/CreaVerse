
-- 1) Feedback prompt controls on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS feedback_prompt_dismissed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS feedback_prompt_snooze_until timestamptz;

-- 2) Assignments quiz builder
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS questions jsonb;

-- 3) Enrollment suspension
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;

-- Adjust assignment SELECT policy so suspended students lose access
DROP POLICY IF EXISTS "Students view assignments for enrolled classes" ON public.assignments;
CREATE POLICY "Students view assignments for enrolled classes"
  ON public.assignments FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.class_code = assignments.class_code
      AND e.student_id = auth.uid()
      AND e.suspended = false
  ));

-- Allow teachers to update suspension on enrollments in their classes
CREATE POLICY "Teachers update enrollments in their classes"
  ON public.enrollments FOR UPDATE
  TO authenticated
  USING (public.is_class_teacher(auth.uid(), class_code))
  WITH CHECK (public.is_class_teacher(auth.uid(), class_code));

CREATE POLICY "Teachers delete enrollments in their classes"
  ON public.enrollments FOR DELETE
  TO authenticated
  USING (public.is_class_teacher(auth.uid(), class_code));

-- 4b) Mentor chat history
CREATE TABLE IF NOT EXISTS public.mentor_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  subject text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentor_messages TO authenticated;
GRANT ALL ON public.mentor_messages TO service_role;
ALTER TABLE public.mentor_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own mentor messages"
  ON public.mentor_messages FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS mentor_messages_user_created_idx
  ON public.mentor_messages(user_id, created_at DESC);

-- 10) Journal entries
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entry_date date NOT NULL DEFAULT current_date,
  mood text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries TO authenticated;
GRANT ALL ON public.journal_entries TO service_role;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own journal"
  ON public.journal_entries FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS journal_entries_user_date_idx
  ON public.journal_entries(user_id, entry_date DESC, created_at DESC);

-- 11) Onboarding responses
CREATE TABLE IF NOT EXISTS public.onboarding_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_grade text,
  discovery_source text,
  purpose text,
  biggest_challenge text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.onboarding_responses TO authenticated;
GRANT ALL ON public.onboarding_responses TO service_role;
ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own onboarding"
  ON public.onboarding_responses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own onboarding"
  ON public.onboarding_responses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins view all onboarding"
  ON public.onboarding_responses FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- 8) Remove Lectures feature (was user-added; per spec: remove fully if present)
DROP TABLE IF EXISTS public.lecture_completions CASCADE;
DROP TABLE IF EXISTS public.lectures CASCADE;

-- 16) Helpful indexes on frequently filtered columns
CREATE INDEX IF NOT EXISTS assignments_class_code_created_idx ON public.assignments(class_code, created_at DESC);
CREATE INDEX IF NOT EXISTS submissions_assignment_idx ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS submissions_student_idx ON public.submissions(student_id);
CREATE INDEX IF NOT EXISTS chat_messages_class_created_idx ON public.chat_messages(class_code, created_at DESC);
CREATE INDEX IF NOT EXISTS enrollments_class_idx ON public.enrollments(class_code);
CREATE INDEX IF NOT EXISTS classes_teacher_idx ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS feedback_user_idx ON public.feedback(user_id);
