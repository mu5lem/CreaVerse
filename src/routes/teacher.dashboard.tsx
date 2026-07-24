import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BackButton } from "@/components/BackButton";
import { QuickNav } from "@/components/QuickNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PlusCircle, GraduationCap, Users, AlertTriangle, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/teacher/dashboard")({
  component: () => (
    <ProtectedRoute role="teacher">
      <TeacherDashboard />
    </ProtectedRoute>
  ),
});

interface ClassRow {
  id: string;
  class_code: string;
  title: string;
  grade: string | null;
  description: string | null;
  created_at: string;
}

function TeacherDashboard() {
  const { profile, signOut, user } = useAuth();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", class_code: "", grade: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [atRiskRows, setAtRiskRows] = useState<{ student_id: string; email: string; avg: number }[]>([]);
  const [pendingDelete, setPendingDelete] = useState<ClassRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("classes")
      .select("id, class_code, title, grade, description, created_at")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    const classList = ((data ?? []) as ClassRow[]);
    setClasses(classList);

    // At-risk students: pull submissions for teacher's assignments
    const codes = classList.map((c) => c.class_code);
    if (codes.length > 0) {
      const { data: assigns } = await supabase.from("assignments").select("id").in("class_code", codes);
      const aids = (assigns ?? []).map((a) => a.id);
      if (aids.length > 0) {
        const { data: subs } = await supabase
          .from("submissions")
          .select("student_id, grade")
          .in("assignment_id", aids);
        const byStudent = new Map<string, number[]>();
        (subs ?? []).forEach((s) => {
          if (!s.grade) return;
          const m = s.grade.match(/(\d+(?:\.\d+)?)/);
          if (!m) return;
          const v = parseFloat(m[1]);
          const score = v > 10 ? v : v * 10;
          if (!byStudent.has(s.student_id)) byStudent.set(s.student_id, []);
          byStudent.get(s.student_id)!.push(score);
        });
        const studentIds = [...byStudent.keys()];
        let emails = new Map<string, string>();
        if (studentIds.length > 0) {
          const { data: profs } = await supabase.from("profiles").select("id, email").in("id", studentIds);
          emails = new Map((profs ?? []).map((p) => [p.id, p.email]));
        }
        const risk = [...byStudent.entries()]
          .map(([student_id, arr]) => ({
            student_id,
            email: emails.get(student_id) ?? student_id,
            avg: arr.reduce((a, b) => a + b, 0) / arr.length,
          }))
          .filter((r) => r.avg < 60)
          .sort((a, b) => a.avg - b.avg)
          .slice(0, 5);
        setAtRiskRows(risk);
      } else setAtRiskRows([]);
    } else setAtRiskRows([]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const createClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || creating) return;
    const code = form.class_code.trim().toUpperCase();
    if (!code || !form.title.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("classes").insert({
      teacher_id: user.id,
      class_code: code,
      title: form.title.trim(),
      grade: form.grade.trim() || null,
      description: form.description.trim() || null,
    });
    setCreating(false);
    if (error) return toast.error(error.message);
    toast.success("Class created");
    setForm({ title: "", class_code: "", grade: "", description: "" });
    await load();
  };

  const confirmDelete = async () => {
    if (!user || !pendingDelete) return;
    setDeleting(true);
    const { error } = await supabase
      .from("classes")
      .delete()
      .eq("class_code", pendingDelete.class_code)
      .eq("teacher_id", user.id);
    setDeleting(false);
    setPendingDelete(null);
    if (error) return toast.error(error.message);
    toast.success("Class deleted");
    await load();
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        title="Teacher Studio"
        role={profile.role}
        email={profile.email}
        onSignOut={signOut}
      />

      <div className="mx-auto max-w-6xl px-6 py-6">
        <BackButton to="/" />
      </div>

      <main className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-10">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
            Your studio
          </h1>
          <p className="mt-2 text-muted-foreground">
            Design classes, invite students with a code, and shape the way they learn.
          </p>
        </div>

        <QuickNav />

        <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-[var(--color-ember)]" />
            <span className="font-medium text-foreground">At-Risk Students</span>
            <span className="text-xs">— average grade below 60%</span>
          </div>
          {atRiskRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No at-risk students detected. Great work!</p>
          ) : (
            <ul className="divide-y divide-border">
              {atRiskRows.map((r) => (
                <li key={r.student_id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-foreground">{r.email}</span>
                  <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                    {Math.round(r.avg)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <form
            onSubmit={createClass}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm md:col-span-1"
          >
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-parchment)] text-[var(--color-ink)]">
              <PlusCircle className="h-5 w-5" />
            </div>
            <h2 className="font-display text-xl text-foreground">Create a Class</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Students join with the class code.
            </p>
            <div className="mt-4 space-y-3">
              <input
                required
                placeholder="Class title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Class code (e.g. MATH101)"
                value={form.class_code}
                onChange={(e) => setForm({ ...form, class_code: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm uppercase"
              />
              <input
                placeholder="Grade / level (optional)"
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm"
                rows={3}
              />
              <button
                type="submit"
                disabled={creating}
                className="w-full rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {creating ? "Creating…" : "Create class"}
              </button>
            </div>
          </form>

          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap className="h-4 w-4" />
              My Classes
            </div>
            {loading ? (
              <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
                Loading…
              </div>
            ) : classes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                No classes yet. Create your first class to get started.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {classes.map((c) => (
                  <div
                    key={c.id}
                    className="group relative rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-[var(--color-ember)]/60"
                  >
                    <Link
                      to="/teacher/class/$classCode"
                      params={{ classCode: c.class_code }}
                      className="block"
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-[var(--color-parchment)] px-2.5 py-0.5 font-mono text-xs text-foreground">
                          {c.class_code}
                        </span>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <h2 className="mt-3 font-display text-lg text-foreground">{c.title}</h2>
                      {c.grade && (
                        <p className="text-xs text-muted-foreground">{c.grade}</p>
                      )}
                      {c.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {c.description}
                        </p>
                      )}
                      <div className="mt-3 text-xs font-medium text-[var(--color-ember)] opacity-0 transition group-hover:opacity-100">
                        Open →
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPendingDelete(c); }}
                      title="Delete class"
                      className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground opacity-0 transition hover:border-destructive/50 hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this class?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && (
                <>Delete class <span className="font-medium text-foreground">"{pendingDelete.title}"</span> ({pendingDelete.class_code})? This permanently removes its enrollments, assignments and submissions.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
