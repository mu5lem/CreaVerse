
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_code text not null references public.classes(class_code) on delete cascade,
  title text not null,
  description text,
  media_url text,
  due_date timestamptz,
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage assignments for own classes"
  ON public.assignments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.class_code = assignments.class_code AND c.teacher_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.classes c WHERE c.class_code = assignments.class_code AND c.teacher_id = auth.uid()));

CREATE POLICY "Students view assignments for enrolled classes"
  ON public.assignments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.class_code = assignments.class_code AND e.student_id = auth.uid()));

CREATE POLICY "Admins view all assignments"
  ON public.assignments FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));


CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  file_url text,
  notes text,
  grade text,
  feedback text,
  submitted_at timestamptz not null default now(),
  UNIQUE (assignment_id, student_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students insert own submissions"
  ON public.submissions FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students view own submissions"
  ON public.submissions FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students update own submissions"
  ON public.submissions FOR UPDATE TO authenticated
  USING (student_id = auth.uid() AND grade IS NULL)
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers view submissions for own classes"
  ON public.submissions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.classes c ON c.class_code = a.class_code
    WHERE a.id = submissions.assignment_id AND c.teacher_id = auth.uid()
  ));

CREATE POLICY "Teachers grade submissions for own classes"
  ON public.submissions FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.classes c ON c.class_code = a.class_code
    WHERE a.id = submissions.assignment_id AND c.teacher_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.classes c ON c.class_code = a.class_code
    WHERE a.id = submissions.assignment_id AND c.teacher_id = auth.uid()
  ));

CREATE POLICY "Admins view all submissions"
  ON public.submissions FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));


-- Storage: policies for the classroom-files bucket (bucket created via tool)
CREATE POLICY "Teachers upload files to own classes"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'classroom-files'
    AND (storage.foldername(name))[1] = 'assignments'
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.class_code = (storage.foldername(name))[2]
        AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students upload own submission files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'classroom-files'
    AND (storage.foldername(name))[1] = 'submissions'
    AND (storage.foldername(name))[3] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.class_code = (storage.foldername(name))[2]
        AND e.student_id = auth.uid()
    )
  );

CREATE POLICY "Class members read classroom files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'classroom-files'
    AND (
      EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.class_code = (storage.foldername(name))[2]
          AND c.teacher_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.enrollments e
        WHERE e.class_code = (storage.foldername(name))[2]
          AND e.student_id = auth.uid()
      )
    )
  );

CREATE POLICY "Owners delete own files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'classroom-files' AND owner = auth.uid());
