
-- Allow class_code to be edited by teachers by cascading updates to referencing tables.
ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS assignments_class_code_fkey;
ALTER TABLE public.assignments
  ADD CONSTRAINT assignments_class_code_fkey
  FOREIGN KEY (class_code) REFERENCES public.classes(class_code)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_class_code_fkey;
ALTER TABLE public.enrollments
  ADD CONSTRAINT enrollments_class_code_fkey
  FOREIGN KEY (class_code) REFERENCES public.classes(class_code)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_class_code_fkey;
ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_class_code_fkey
  FOREIGN KEY (class_code) REFERENCES public.classes(class_code)
  ON UPDATE CASCADE ON DELETE CASCADE;
