import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/teacher/assignment/$assignmentId")({
  component: () => (
    <ProtectedRoute role="teacher">
      <AssignmentGrading />
    </ProtectedRoute>
  ),
});

interface Assignment {
  id: string;
  class_code: string;
  title: string;
  description: string | null;
  media_url: string | null;
  due_date: string | null;
}
interface Submission {
  id: string;
  student_id: string;
  file_url: string | null;
  notes: string | null;
  grade: string | null;
  feedback: string | null;
  submitted_at: string;
  student_email?: string | null;
}

function AssignmentGrading() {
  const { assignmentId } = Route.useParams();
  const { profile, signOut } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, { grade: string; feedback: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState<Record<string, boolean>>({});

  const openFile = async (path: string) => {
    const { data, error } = await supabase.storage.from("classroom-files").createSignedUrl(path, 300);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data: a } = await supabase.from("assignments").select("*").eq("id", assignmentId).maybeSingle();
    setAssignment((a as Assignment | null) ?? null);
    const { data: s } = await supabase
      .from("submissions")
      .select("*")
      .eq("assignment_id", assignmentId)
      .order("submitted_at", { ascending: false });
    const list = (s ?? []) as Submission[];
    if (list.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", list.map((x) => x.student_id));
      const emails = new Map((profs ?? []).map((p) => [p.id, p.email]));
      list.forEach((x) => (x.student_email = emails.get(x.student_id) ?? null));
    }
    setSubs(list);
    setDrafts(
      Object.fromEntries(list.map((x) => [x.id, { grade: x.grade ?? "", feedback: x.feedback ?? "" }])),
    );
    setLoading(false);
  }, [assignmentId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveGrade = async (id: string) => {
    const d = drafts[id];
    if (!d) return;
    setSaving(id);
    const { error } = await supabase
      .from("submissions")
      .update({ grade: d.grade || null, feedback: d.feedback || null })
      .eq("id", id)
      .select()
      .single();
    setSaving(null);
    if (error) return toast.error(error.message);
    toast.success("Remarks saved");
    setJustSaved((prev) => ({ ...prev, [id]: true }));
    setSubs((prev) => prev.map((x) => (x.id === id ? { ...x, grade: d.grade || null, feedback: d.feedback || null } : x)));
    setTimeout(() => setJustSaved((prev) => ({ ...prev, [id]: false })), 2500);
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="Grading" role={profile.role} email={profile.email} onSignOut={signOut} />
      <div className="mx-auto max-w-5xl px-6 py-6">
        <BackButton />
      </div>
      <main className="mx-auto max-w-5xl px-6 pb-16">
        {loading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : !assignment ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            Assignment not found.
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--color-parchment)] px-3 py-1 font-mono text-xs">
                {assignment.class_code}
              </div>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
                {assignment.title}
              </h1>
              {assignment.description && (
                <p className="mt-2 text-muted-foreground">{assignment.description}</p>
              )}
              {assignment.due_date && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Due {new Date(assignment.due_date).toLocaleString()}
                </p>
              )}
              {assignment.media_url && (
                <button
                  onClick={() => openFile(assignment.media_url!)}
                  className="mt-3 text-sm font-medium text-[var(--color-ember)] underline-offset-4 hover:underline"
                >
                  Open attached file
                </button>
              )}
            </div>

            <h2 className="mb-4 font-display text-2xl text-foreground">Submissions</h2>
            {subs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
                No submissions yet.
              </div>
            ) : (
              <div className="space-y-4">
                {subs.map((s) => (
                  <div key={s.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-sm font-medium text-foreground">
                        {s.student_email ?? s.student_id}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(s.submitted_at).toLocaleString()}
                      </div>
                    </div>
                    {s.notes && <p className="mb-3 text-sm text-muted-foreground">{s.notes}</p>}
                    {s.file_url && (
                      <button
                        onClick={() => openFile(s.file_url!)}
                        className="mb-3 text-sm font-medium text-[var(--color-ember)] underline-offset-4 hover:underline"
                      >
                        Open submission file
                      </button>
                    )}
                    <div className="grid gap-3 sm:grid-cols-[120px_1fr_auto]">
                      <input
                        placeholder="Grade"
                        value={drafts[s.id]?.grade ?? ""}
                        onChange={(e) =>
                          setDrafts({ ...drafts, [s.id]: { ...drafts[s.id], grade: e.target.value } })
                        }
                        className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                      <input
                        placeholder="Feedback"
                        value={drafts[s.id]?.feedback ?? ""}
                        onChange={(e) =>
                          setDrafts({ ...drafts, [s.id]: { ...drafts[s.id], feedback: e.target.value } })
                        }
                        className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                      <button
                        onClick={() => saveGrade(s.id)}
                        disabled={saving === s.id}
                        className={`rounded-full px-5 py-2 text-sm font-medium transition disabled:opacity-60 ${justSaved[s.id] ? "bg-emerald-600 text-white" : "bg-primary text-primary-foreground hover:opacity-90"}`}
                      >
                        {saving === s.id ? "Saving…" : justSaved[s.id] ? "Saved ✓" : "Save"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
