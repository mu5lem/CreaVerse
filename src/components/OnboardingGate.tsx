import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Moon, Sun, Monitor, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type ThemePref = "system" | "light" | "dark";

const THEME_KEY = "creaverse:theme";

function applyTheme(theme: ThemePref) {
  const prefersDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}

/**
 * First-run experience for a newly signed-in user:
 *  1. Survey (4 short questions) — saved to `onboarding_responses` (admins read this).
 *  2. Only after the survey submits, ask them to pick Light / Dark / System.
 *
 * Nothing renders while signed out — no theme picker, no survey on the public landing page.
 */
export function OnboardingGate() {
  const { user, loading } = useAuth();
  const [needsSurvey, setNeedsSurvey] = useState(false);
  const [needsTheme, setNeedsTheme] = useState(false);
  const [checked, setChecked] = useState(false);

  // Signed out → hide everything and reset any pending prompts.
  useEffect(() => {
    if (!loading && !user) {
      setNeedsSurvey(false);
      setNeedsTheme(false);
      setChecked(false);
    }
  }, [user, loading]);

  // Signed in: figure out what still needs to happen for this user.
  useEffect(() => {
    if (loading || !user || checked) return;
    let cancelled = false;
    (async () => {
      const { data: existing } = await supabase
        .from("onboarding_responses")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const hasTheme = (() => {
        try {
          return !!localStorage.getItem(THEME_KEY);
        } catch {
          return false;
        }
      })();
      // Theme first, then survey.
      if (!hasTheme) {
        setNeedsTheme(true);
      } else if (!existing) {
        setNeedsSurvey(true);
      }
      setChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading, checked]);

  const onSurveyDone = () => {
    setNeedsSurvey(false);
  };

  const chooseTheme = async (t: ThemePref) => {
    applyTheme(t);
    setNeedsTheme(false);
    // After theme, prompt for survey if not yet submitted.
    if (!user) return;
    const { data: existing } = await supabase
      .from("onboarding_responses")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!existing) setNeedsSurvey(true);
  };

  if (loading || !user) return null;

  if (needsTheme) {

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
        <div className="animate-fade-up w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
          <div className="mb-2 flex items-center gap-2 text-[var(--color-ember)]">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">One last thing</span>
          </div>
          <h2 className="font-display text-2xl font-semibold text-foreground">Pick your theme</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose how CreaVerse should look on this device. You can change it anytime in Settings.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => chooseTheme("light")}
              className="press flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-4 text-sm hover:border-[var(--color-ember)]"
            >
              <Sun className="h-5 w-5 text-[var(--color-ember)]" />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => chooseTheme("dark")}
              className="press flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-4 text-sm hover:border-[var(--color-ember)]"
            >
              <Moon className="h-5 w-5 text-[var(--color-ember)]" />
              <span>Dark</span>
            </button>
            <button
              type="button"
              onClick={() => chooseTheme("system")}
              className="press flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-4 text-sm hover:border-[var(--color-ember)]"
            >
              <Monitor className="h-5 w-5 text-[var(--color-ember)]" />
              <span>System</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (needsSurvey) {
    return <SurveyDialog userId={user.id} onDone={onSurveyDone} />;
  }

  return null;
}


const PURPOSES = [
  "I'm a student — for classes & study",
  "I'm a teacher — to run classes",
  "For exam preparation (MDCAT/ECAT/SAT/etc.)",
  "For AI mentoring & career guidance",
  "Just exploring what the app can do",
  "Other",
];
const SOURCES = [
  "Friend or classmate",
  "Teacher / school",
  "Social media (Instagram, TikTok, YouTube)",
  "Google or web search",
  "News / blog / article",
  "Other",
];
const AGE_GROUPS = ["Under 13", "13–17", "18–24", "25–34", "35 or older"];

function SurveyDialog({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [purpose, setPurpose] = useState("");
  const [source, setSource] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [dailyGoal, setDailyGoal] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = purpose && source && ageGroup && dailyGoal.trim().length > 0;

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("onboarding_responses")
      .insert({
        user_id: userId,
        purpose,
        discovery_source: source,
        age_group: ageGroup,
        biggest_challenge: dailyGoal.trim(),
      });
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") {
        onDone();
        return;
      }
      toast.error(error.message || "Could not save your responses.");
      return;
    }
    toast.success("Thanks! Your answers have been sent to the admin.");
    onDone();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="animate-fade-up w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-2 flex items-center gap-2 text-[var(--color-ember)]">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">Quick intro survey</span>
        </div>
        <h2 className="font-display text-2xl font-semibold text-foreground">Help us make CreaVerse fit you</h2>
        <p className="mt-1 text-sm text-muted-foreground">Four short questions — takes under a minute. Your answers go straight to our team.</p>

        <div className="mt-5 grid gap-4 max-h-[65vh] overflow-y-auto pr-1">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Why did you come to CreaVerse?</label>
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="">Choose one…</option>
              {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">How did you hear about us?</label>
            <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="">Choose one…</option>
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Your age group</label>
            <div className="flex flex-wrap gap-2">
              {AGE_GROUPS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAgeGroup(a)}
                  className={`press rounded-full border px-3 py-1.5 text-xs transition ${ageGroup === a ? "border-[var(--color-ember)] bg-[var(--color-ember)]/10 text-foreground" : "border-border text-muted-foreground"}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">What's one thing you hope to achieve with CreaVerse in the next month?</label>
            <textarea
              value={dailyGoal}
              onChange={(e) => setDailyGoal(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="e.g. finish MDCAT biology, improve my grade, ship my first project…"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit || submitting}
            className="press rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
