
-- 1. Allow class members to view each other's profiles (for chat names, rosters)
CREATE POLICY "Class members view each other profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.teacher_id = auth.uid() AND (
      c.teacher_id = profiles.id
      OR public.is_enrolled(profiles.id, c.class_code)
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.student_id = auth.uid() AND (
      public.is_class_teacher(profiles.id, e.class_code)
      OR public.is_enrolled(profiles.id, e.class_code)
    )
  )
);

-- 2. Lectures
CREATE TABLE public.lectures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_code text NOT NULL REFERENCES public.classes(class_code) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  media_url text,
  link_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lectures_class_code_idx ON public.lectures(class_code);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lectures TO authenticated;
GRANT ALL ON public.lectures TO service_role;
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Class members view lectures"
ON public.lectures FOR SELECT TO authenticated
USING (public.is_class_teacher(auth.uid(), class_code) OR public.is_enrolled(auth.uid(), class_code));

CREATE POLICY "Teachers insert lectures"
ON public.lectures FOR INSERT TO authenticated
WITH CHECK (public.is_class_teacher(auth.uid(), class_code));

CREATE POLICY "Teachers update lectures"
ON public.lectures FOR UPDATE TO authenticated
USING (public.is_class_teacher(auth.uid(), class_code))
WITH CHECK (public.is_class_teacher(auth.uid(), class_code));

CREATE POLICY "Teachers delete lectures"
ON public.lectures FOR DELETE TO authenticated
USING (public.is_class_teacher(auth.uid(), class_code));

-- 3. Lecture completions
CREATE TABLE public.lecture_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id uuid NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lecture_id, student_id)
);
CREATE INDEX lecture_completions_student_idx ON public.lecture_completions(student_id);

GRANT SELECT, INSERT, DELETE ON public.lecture_completions TO authenticated;
GRANT ALL ON public.lecture_completions TO service_role;
ALTER TABLE public.lecture_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own completions"
ON public.lecture_completions FOR SELECT TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Teachers view class completions"
ON public.lecture_completions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lectures l
    WHERE l.id = lecture_completions.lecture_id
      AND public.is_class_teacher(auth.uid(), l.class_code)
  )
);

CREATE POLICY "Students mark own completion"
ON public.lecture_completions FOR INSERT TO authenticated
WITH CHECK (
  student_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.lectures l
    WHERE l.id = lecture_completions.lecture_id
      AND public.is_enrolled(auth.uid(), l.class_code)
  )
);

CREATE POLICY "Students unmark own completion"
ON public.lecture_completions FOR DELETE TO authenticated
USING (student_id = auth.uid());
