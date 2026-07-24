
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_code text NOT NULL,
  teacher_id uuid NOT NULL,
  student_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;
CREATE INDEX IF NOT EXISTS direct_messages_thread_idx
  ON public.direct_messages (class_code, teacher_id, student_id, created_at);
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their DMs"
  ON public.direct_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = teacher_id OR auth.uid() = student_id);

CREATE POLICY "Participants can send DMs"
  ON public.direct_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (auth.uid() = teacher_id OR auth.uid() = student_id)
  );
