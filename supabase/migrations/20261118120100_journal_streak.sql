-- Real journal streak, maintained only by the database.
-- A streak = number of consecutive days (ending today or yesterday) with at least one journal entry.

CREATE OR REPLACE FUNCTION public.recompute_journal_streak(_user uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_streak integer := 0;
  v_expected date := current_date;
  v_day date;
BEGIN
  -- Allow today to be missing (streak still alive until the day ends).
  IF NOT EXISTS (SELECT 1 FROM public.journal_entries WHERE user_id = _user AND entry_date = current_date) THEN
    v_expected := current_date - 1;
  END IF;

  FOR v_day IN
    SELECT DISTINCT entry_date FROM public.journal_entries
    WHERE user_id = _user AND entry_date <= current_date
    ORDER BY entry_date DESC
  LOOP
    EXIT WHEN v_day <> v_expected;
    v_streak := v_streak + 1;
    v_expected := v_expected - 1;
  END LOOP;

  PERFORM set_config('creaverse.bypass_profile_guard', 'on', true);
  UPDATE public.profiles SET current_streak = v_streak WHERE id = _user AND current_streak IS DISTINCT FROM v_streak;
  PERFORM set_config('creaverse.bypass_profile_guard', 'off', true);
  RETURN v_streak;
END;
$$;

CREATE OR REPLACE FUNCTION public.journal_entries_update_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recompute_journal_streak(COALESCE(NEW.user_id, OLD.user_id));
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS journal_entries_streak ON public.journal_entries;
CREATE TRIGGER journal_entries_streak
  AFTER INSERT OR UPDATE OF entry_date OR DELETE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.journal_entries_update_streak();

-- Not callable through the API; only the trigger uses them.
REVOKE ALL ON FUNCTION public.recompute_journal_streak(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.journal_entries_update_streak() FROM PUBLIC, anon, authenticated;

-- Live, read-only streak for the signed-in user (never stale; runs under RLS).
CREATE OR REPLACE FUNCTION public.my_journal_streak()
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_streak integer := 0;
  v_expected date := current_date;
  v_day date;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.journal_entries WHERE user_id = auth.uid() AND entry_date = current_date) THEN
    v_expected := current_date - 1;
  END IF;
  FOR v_day IN
    SELECT DISTINCT entry_date FROM public.journal_entries
    WHERE user_id = auth.uid() AND entry_date <= current_date
    ORDER BY entry_date DESC
  LOOP
    EXIT WHEN v_day <> v_expected;
    v_streak := v_streak + 1;
    v_expected := v_expected - 1;
  END LOOP;
  RETURN v_streak;
END;
$$;
REVOKE ALL ON FUNCTION public.my_journal_streak() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_journal_streak() TO authenticated;

-- Guard: signed-in users can no longer write current_streak directly.
CREATE OR REPLACE FUNCTION public.profiles_guard_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bypass text;
BEGIN
  BEGIN
    v_bypass := current_setting('creaverse.bypass_profile_guard', true);
  EXCEPTION WHEN others THEN
    v_bypass := NULL;
  END;
  IF v_bypass = 'on' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Not allowed to change role directly';
  END IF;
  IF NEW.is_suspended IS DISTINCT FROM OLD.is_suspended THEN
    RAISE EXCEPTION 'Not allowed to change suspension status';
  END IF;
  IF NEW.current_streak IS DISTINCT FROM OLD.current_streak THEN
    RAISE EXCEPTION 'Streak is maintained automatically';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.profiles_guard_privileged_columns() FROM PUBLIC, anon, authenticated;

-- Backfill existing users once.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT DISTINCT user_id FROM public.journal_entries LOOP
    PERFORM public.recompute_journal_streak(r.user_id);
  END LOOP;
END $$;
