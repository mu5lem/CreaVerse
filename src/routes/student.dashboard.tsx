import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BackButton } from "@/components/BackButton";
import { QuickNav } from "@/components/QuickNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { brand } from "@/lib/brand";
import { Flame, Sparkles, BookOpen, GraduationCap, TrendingUp, AlertCircle } from "lucide-react";
import { DailyQuote } from "@/components/DailyQuote";
import { VerificationGate, readPendingVerification, clearPendingVerification, type VerifyIntent } from "@/components/VerificationGate";

export const Route = createFileRoute("/student/dashboard")({
  component: () => (
    <ProtectedRoute role="student">
      <StudentDashboard />
    </ProtectedRoute>
  ),
});

interface EnrolledClass {
  class_code: string;
  title: string;
  grade: string | null;
}

function StudentDashboard() {
  const { profile, signOut, refreshProfile, user } = useAuth();
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState("");
  const [upgrading, setUpgrading] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [classes, setClasses] = useState<EnrolledClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<{ grade: string | null; class_code: string }[]>([]);
  const [gateIntent, setGateIntent] = useState<VerifyIntent | null>(null);
  const [gateVerified, setGateVerified] = useState(false);
  const verified = profile?.email_verified === true;

  // Returning from the Google verification redirect: mark verified, resume intent.
  useEffect(() => {
    const pending = readPendingVerification();
    if (!pending || !user) return;
    clearPendingVerification();
    (async () => {
      await supabase
        .from("profiles")
        .update({ email: user.email ?? profile?.email ?? "", email_verified: true })
        .eq("id", user.id);
      await refreshProfile();
      setGateVerified(true);
      setGateIntent(pending);
    })();
  }, [user, profile?.email, refreshProfile]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: enr } = await supabase
      .from("enrollments")
      .select("class_code")
      .eq("student_id", user.id);
    const codes = (enr ?? []).map((e) => e.class_code);
    let clsList: EnrolledClass[] = [];
    if (codes.length > 0) {
      const { data: cls } = await supabase
        .from("classes")
        .select("class_code, title, grade")
        .in("class_code", codes);
      clsList = (cls ?? []) as EnrolledClass[];
    }
    setClasses(clsList);

    // Predictive analytics: fetch own submissions with grades
    const { data: subs } = await supabase
      .from("submissions")
      .select("grade, assignment_id, assignments(class_code)")
      .eq("student_id", user.id);
    type SubRow = { grade: string | null; assignments: { class_code: string } | null };
    const mapped = ((subs ?? []) as unknown as SubRow[])
      .map((s) => ({ grade: s.grade, class_code: s.assignments?.class_code ?? "" }))
      .filter((s) => s.class_code);
    setGrades(mapped);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || joining) return;
    if (!verified) { setGateVerified(false); setGateIntent("student"); return; }
    const code = classCode.trim().toUpperCase();
    if (!code) return;
    setJoining(true);
    const { data, error } = await supabase.rpc("join_class", { _code: code });
    setJoining(false);
    const result = data as { success: boolean; error?: string } | null;
    if (error) {
      toast.error(error.message);
    } else if (!result?.success) {
      toast.error(result?.error ?? "Could not join that class");
    } else {
      toast.success("Enrolled!");
    }
    setClassCode("");
    await load();

  };

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verified) { setGateVerified(false); setGateIntent("teacher"); return; }
    if (!inviteCode.trim() || upgrading) return;
    setUpgrading(true);
    try {
      const { data, error } = await supabase.rpc("request_role_upgrade", {
        requested_role: "teacher",
        invite_code: inviteCode.trim(),
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        toast.error(result.error ?? "Invite code was rejected");
        return;
      }
      toast.success("You're now a teacher — welcome!");
      await refreshProfile();
      navigate({ to: "/teacher/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUpgrading(false);
    }
  };

  // Predictive analytics: parse numeric grades, compute overall + per-class avg
  const analytics = useMemo(() => {
    const numeric = grades
      .map((g) => {
        if (!g.grade) return null;
        const m = g.grade.match(/(\d+(?:\.\d+)?)/);
        if (!m) return null;
        const val = parseFloat(m[1]);
        // Normalize: if looks like /10 scale
        return { class_code: g.class_code, score: val > 10 ? val : val * 10 };
      })
      .filter((x): x is { class_code: string; score: number } => x !== null);
    if (numeric.length === 0) return { avg: null as number | null, weak: [] as { class_code: string; avg: number }[] };
    const avg = numeric.reduce((a, b) => a + b.score, 0) / numeric.length;
    const byClass = new Map<string, number[]>();
    numeric.forEach((n) => {
      if (!byClass.has(n.class_code)) byClass.set(n.class_code, []);
      byClass.get(n.class_code)!.push(n.score);
    });
    const perClass = [...byClass.entries()].map(([class_code, arr]) => ({
      class_code,
      avg: arr.reduce((a, b) => a + b, 0) / arr.length,
    }));
    const weak = perClass.filter((c) => c.avg < 70).sort((a, b) => a.avg - b.avg).slice(0, 3);
    return { avg, weak };
  }, [grades]);

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        title="Student Home"
        role={profile.role}
        email={profile.email}
        onSignOut={signOut}
      />

      <div className="mx-auto max-w-6xl px-6 py-6">
        <BackButton to="/" />
      </div>

      <main className="mx-auto max-w-6xl px-6 pb-16">
        {user && <DailyQuote userId={user.id} />}
        <div className="mb-10">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
            Hello, {profile.full_name?.trim() || profile.email.split("@")[0]}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Pick up where you left off, or explore something new today.
          </p>
        </div>

        <div className="mb-8 flex items-center justify-between rounded-2xl border border-border bg-[var(--color-parchment)] p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-ember)]/15 text-[var(--color-ember)]">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Current streak
              </div>
              <div className="font-display text-2xl text-foreground">
                {profile.current_streak} {profile.current_streak === 1 ? "day" : "days"}
              </div>
            </div>
          </div>
          <div className="hidden text-right sm:block">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Learning is a habit
            </div>
            <div className="text-sm text-foreground">Small steps, every day.</div>
          </div>
        </div>

        <QuickNav />


        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <TrendingUp className="h-4 w-4" /> Success Score
            </div>
            {analytics.avg === null ? (
              <p className="text-sm text-muted-foreground">Submit and get graded work to unlock your predicted success score.</p>
            ) : (
              <>
                <div className="font-display text-4xl text-foreground">{Math.round(analytics.avg)}%</div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--color-parchment)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-ember)] transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, analytics.avg))}%` }}
                  />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Based on your graded submissions across all classes.</p>
              </>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <AlertCircle className="h-4 w-4" /> Weak Areas
            </div>
            {analytics.weak.length === 0 ? (
              <p className="text-sm text-muted-foreground">No weak areas detected — keep it up!</p>
            ) : (
              <ul className="space-y-2">
                {analytics.weak.map((w) => (
                  <li key={w.class_code} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <span className="font-mono text-xs">{w.class_code}</span>
                    <span className="text-[var(--color-ember)]">{Math.round(w.avg)}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>


        <div className="grid gap-6 md:grid-cols-3">
          <form onSubmit={handleEnroll} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-parchment)] text-[var(--color-ink)]">
              <BookOpen className="h-5 w-5" />
            </div>
            <h2 className="font-display text-xl text-foreground">Join a Class</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter the class code your teacher gave you.
            </p>
            <input
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              placeholder="Class code"
              className="mt-4 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm uppercase outline-none focus:border-[var(--color-ember)] focus:ring-2 focus:ring-[var(--color-ember)]/20"
            />
            <button
              type="submit"
              disabled={joining || !classCode.trim()}
              className="mt-3 w-full rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {joining ? "Joining…" : "Enroll"}
            </button>
          </form>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-parchment)] text-[var(--color-ink)]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h2 className="font-display text-xl text-foreground">My Classes</h2>
            {loading ? (
              <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
            ) : classes.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                You haven't joined any classes yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {classes.map((c) => (
                  <li key={c.class_code}>
                    <Link
                      to="/student/class/$classCode"
                      params={{ classCode: c.class_code }}
                      className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm transition hover:border-[var(--color-ember)]/50"
                    >
                      <span className="text-foreground">{c.title}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {c.class_code}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form
            onSubmit={handleUpgrade}
            className="rounded-2xl border border-[var(--color-ember)]/40 bg-card p-6 shadow-sm"
          >
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-ember)]/15 text-[var(--color-ember)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="font-display text-xl text-foreground">Become a Teacher</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Got an invite code from {brand.name}? Enter it below to unlock a teacher workspace.
              Codes come from an existing admin or teacher — admin accounts are never self-service.
            </p>
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Invite code"
              className="mt-4 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-[var(--color-ember)] focus:ring-2 focus:ring-[var(--color-ember)]/20"
            />
            <button
              type="submit"
              disabled={upgrading || !inviteCode.trim()}
              className="mt-3 w-full rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {upgrading ? "Verifying…" : "Redeem code"}
            </button>
          </form>
        </div>
      </main>

      <VerificationGate
        intent={gateIntent ?? "student"}
        open={gateIntent !== null}
        startVerified={gateVerified}
        onClose={() => { setGateIntent(null); setGateVerified(false); load(); }}
      />
    </div>
  );
}
