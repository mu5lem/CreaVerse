
CREATE POLICY "Students delete own submissions"
  ON public.submissions FOR DELETE
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Senders update own chat"
  ON public.chat_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Senders delete own chat"
  ON public.chat_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);
