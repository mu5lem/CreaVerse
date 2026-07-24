import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { MessageSquare, Star, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// Show the auto feedback prompt only after the user has spent real time in
// the app — never on first signup / first open. Rules:
//   - Must be at least the user's SECOND app-open (visits >= 2), AND
//   - At least 2 hours since account creation, AND
//   - At least 72h since the last auto prompt.
const AUTO_INTERVAL_MS = 72 * 60 * 60 * 1000; // 72h between auto prompts
const MIN_ACCOUNT_AGE_MS = 2 * 60 * 60 * 1000; // 2h after signup
const LAST_AUTO_KEY_PREFIX = "creaverse_feedback_last_auto_"; // + user.id
const VISIT_COUNT_KEY_PREFIX = "creaverse_visits_"; // + user.id
const SESSION_MARKED_KEY_PREFIX = "creaverse_session_marked_"; // + user.id (sessionStorage)

export function FeedbackButton() {
  const { user, profile, refreshProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");
  const [saving, setSaving] = useState(false);

  const openManual = () => {
    setMode("manual");
    setRating(0);
    setComments("");
    setOpen(true);
  };

  const openAuto = useCallback(() => {
    setMode("auto");
    setRating(0);
    setComments("");
    setOpen(true);
  }, []);

  // Automatic popup every ~72h, per-user, respecting snooze + dismissal.
  useEffect(() => {
    if (!user || !profile) return;
    if (profile.feedback_prompt_dismissed) return;

    const snoozeUntil = profile.feedback_prompt_snooze_until
      ? new Date(profile.feedback_prompt_snooze_until).getTime()
      : 0;
    if (snoozeUntil > Date.now()) return;

    // Count this session exactly once per browser tab.
    const visitKey = VISIT_COUNT_KEY_PREFIX + user.id;
    const sessionKey = SESSION_MARKED_KEY_PREFIX + user.id;
    try {
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, "1");
        const prev = Number(localStorage.getItem(visitKey) ?? 0);
        localStorage.setItem(visitKey, String(prev + 1));
      }
    } catch {
      /* ignore */
    }

    const visits = Number(localStorage.getItem(visitKey) ?? 0);
    if (visits < 2) return; // First-ever open: never auto-prompt

    const accountAge = Date.now() - new Date(profile.created_at).getTime();
    if (accountAge < MIN_ACCOUNT_AGE_MS) return; // Account < 2h old

    const lastKey = LAST_AUTO_KEY_PREFIX + user.id;
    const lastShown = Number(localStorage.getItem(lastKey) ?? 0);
    const dueAt = lastShown + AUTO_INTERVAL_MS;
    const delay = Math.max(0, dueAt - Date.now());
    // First qualifying session: wait 30s so we don't ambush the user on load.
    const initialDelay = lastShown === 0 ? 30_000 : delay;

    const t = window.setTimeout(() => {
      localStorage.setItem(lastKey, String(Date.now()));
      openAuto();
    }, initialDelay);
    return () => window.clearTimeout(t);
  }, [user, profile, openAuto]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating < 1) return toast.error("Please pick a rating");
    setSaving(true);
    const { error } = await supabase
      .from("feedback")
      .insert({ user_id: user.id, rating, comments: comments.trim() || null });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Thanks for your feedback!");
    setOpen(false);
    setRating(0);
    setComments("");
  };

  const snooze = async () => {
    const until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    if (user) {
      await supabase
        .from("profiles")
        .update({ feedback_prompt_snooze_until: until.toISOString() })
        .eq("id", user.id);
      await refreshProfile();
    }
    toast.success("We'll ask you again later.");
    setOpen(false);
  };

  const neverAgain = async () => {
    if (user) {
      await supabase
        .from("profiles")
        .update({ feedback_prompt_dismissed: true })
        .eq("id", user.id);
      await refreshProfile();
    }
    toast.message("We won't ask you automatically again. You can still open feedback from the top bar anytime.");
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={openManual}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-secondary"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        Feedback
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl text-foreground">
                {mode === "auto" ? "How's CreaVerse going?" : "Share your feedback"}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {mode === "auto" && (
              <p className="mb-3 text-xs text-muted-foreground">
                We check in every few days. You can silence this popup below — the Feedback button up top will still work.
              </p>
            )}
            <div className="mb-4 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="rounded-full p-1"
                  aria-label={`${n} star`}
                >
                  <Star
                    className={`h-6 w-6 transition ${
                      n <= rating ? "fill-[var(--color-ember)] text-[var(--color-ember)]" : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="What could we improve?"
              rows={4}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
            <div className="mt-4 grid gap-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {saving ? "Sending…" : "Submit"}
              </button>
              {mode === "auto" && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={snooze}
                    className="rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition hover:bg-secondary"
                  >
                    Ask Me Later
                  </button>
                  <button
                    type="button"
                    onClick={neverAgain}
                    className="rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground transition hover:bg-secondary"
                  >
                    Never Show Automatically
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      )}
    </>
  );
}
