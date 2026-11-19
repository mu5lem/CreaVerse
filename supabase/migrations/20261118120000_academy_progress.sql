-- Academy progress: one row per (user, resource) the user has marked done.
CREATE TABLE IF NOT EXISTS public.academy_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_id text NOT NULL CHECK (char_length(resource_id) BETWEEN 1 AND 120),
  status text NOT NULL DEFAULT 'done' CHECK (status IN ('started', 'done')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, resource_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_progress TO authenticated;
GRANT ALL ON public.academy_progress TO service_role;
ALTER TABLE public.academy_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own academy progress"
  ON public.academy_progress FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS academy_progress_user_updated_idx
  ON public.academy_progress (user_id, updated_at DESC);
