CREATE POLICY "Owners update own files" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'classroom-files' AND owner = auth.uid())
WITH CHECK (
  bucket_id = 'classroom-files' AND owner = auth.uid() AND (
    ((storage.foldername(name))[1] = 'assignments' AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.class_code = (storage.foldername(name))[2] AND c.teacher_id = auth.uid()))
    OR
    ((storage.foldername(name))[1] = 'submissions'
      AND (storage.foldername(name))[3] = auth.uid()::text
      AND EXISTS (
        SELECT 1 FROM public.enrollments e
        WHERE e.class_code = (storage.foldername(name))[2] AND e.student_id = auth.uid()))
  )
);