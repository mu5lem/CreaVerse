import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, LogOut } from "lucide-react";
import { ClassChat } from "@/components/ClassChat";
import { LinkPreview } from "@/components/LinkPreview";
import { DirectMessagePanel } from "@/components/DirectMessagePanel";
import { useConfirm } from "@/components/ConfirmDialog";
import { QuizTaker } from "@/components/QuizTaker";
import type { Question, AnswerMap } from "@/lib/quiz-types";
import { autoScore, totalPoints } from "@/lib/quiz-types";

export const Route = createFileRoute("/student/class/$classCode")({
  component: () => (
    <ProtectedRoute role="student">
      <StudentClass />
    </ProtectedRoute>
  ),
});

interface ClassRow {
  class_code: string;
  title: string;
  grade: string | null;
  description: string | null;
  teacher_id: string;
  teacher_name?: string | null;
}
interface Assignment {
  id: string;
  title: string;
  description: string | null;
  media_url: string | null;
  link_url: string | null;
  due_date: string | null;
}
interface Submission {
  id: string;
  assignment_id: string;
  file_url: string | null;
  notes: string | null;
  grade: string | null;
  feedback: string | null;
  submitted_at: string;
}

function StudentClass() {
  const { classCode } = Route.useParams();
  const { profile, signOut, user } = useAuth();
  const [cls, setCls] = useState<ClassRow | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, { notes: string; file: File | null }>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [editingSub, setEditingSub] = useState<Record<string, string>>({});
  const confirm = useConfirm();

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: c }, { data: asn }, { data: subs }] = await Promise.all([
      supabase.from("classes").select("*").eq("class_code", classCode).maybeSingle(),
      supabase.from("assignments").select("*").eq("class_code", classCode).order("created_at", { ascending: false }).limit(100),
      supabase.from("submissions").select("*").eq("student_id", user.id).limit(200),
    ]);
    let classRow = (c as ClassRow | null) ?? null;
    if (classRow?.teacher_id) {
      const { data: t } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", classRow.teacher_id)
        .maybeSingle();
      classRow = { ...classRow, teacher_name: t?.full_name || t?.email || null };
    }
    setCls(classRow);
    setAssignments((asn ?? []) as Assignment[]);
    const map: Record<string, Submission> = {};
    ((subs ?? []) as Submission[]).forEach((s) => (map[s.assignment_id] = s));
    setSubmissions(map);
    setLoading(false);
  }, [user, classCode]);

  useEffect(() => {
    load();
  }, [load]);

  // Hydrate submission draft notes from localStorage once assignments are known.
  const draftsKey = `draft:submissions:${classCode}`;
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(draftsKey);
      if (saved) {
        const obj = JSON.parse(saved) as Record<string, string>;
        setDrafts((prev) => {
          const next = { ...prev };
          Object.entries(obj).forEach(([aid, notes]) => {
            if (!next[aid]) next[aid] = { notes, file: null };
            else next[aid] = { ...next[aid], notes };
          });
          return next;
        });
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classCode]);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const notesOnly: Record<string, string> = {};
        Object.entries(drafts).forEach(([aid, d]) => { if (d.notes) notesOnly[aid] = d.notes; });
        if (Object.keys(notesOnly).length === 0) window.localStorage.removeItem(draftsKey);
        else window.localStorage.setItem(draftsKey, JSON.stringify(notesOnly));
      } catch { /* ignore */ }
    }, 500);
    return () => clearTimeout(t);
  }, [drafts, draftsKey]);


  const openFile = async (path: string) => {
    const { data, error } = await supabase.storage.from("classroom-files").createSignedUrl(path, 300);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  };

  const submitWork = async (a: Assignment) => {
    if (!user || submitting) return;
    const draft = drafts[a.id] ?? { notes: "", file: null };
    if (!draft.notes.trim() && !draft.file) {
      toast.error("Add notes or attach a file");
      return;
    }
    setSubmitting(a.id);
    try {
      let filePath: string | null = null;
      if (draft.file) {
        filePath = `submissions/${classCode}/${user.id}/${a.id}/${draft.file.name}`;
        const { error: upErr } = await supabase.storage
          .from("classroom-files")
          .upload(filePath, draft.file, { upsert: true });
        if (upErr) throw upErr;
      }
      const { error } = await supabase.from("submissions").upsert(
        {
          assignment_id: a.id,
          student_id: user.id,
          notes: draft.notes.trim() || null,
          file_url: filePath,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "assignment_id,student_id" },
      );
      if (error) throw error;
      toast.success("Submitted");
      setDrafts({ ...drafts, [a.id]: { notes: "", file: null } });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(null);
    }
  };

  const deleteSubmission = async (a: Assignment) => {
    const sub = submissions[a.id];
    if (!sub || !user) return;
    const ok = await confirm({ title: "Delete your submission?", description: "You can submit again after this.", confirmText: "Delete", destructive: true });
    if (!ok) return;
    if (sub.file_url) {
      await supabase.storage.from("classroom-files").remove([sub.file_url]);
    }
    const { error } = await supabase.from("submissions").delete().eq("id", sub.id).eq("student_id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Submission deleted");
    await load();
  };

  const saveEditedNotes = async (a: Assignment) => {
    const sub = submissions[a.id];
    if (!sub || !user) return;
    const next = editingSub[a.id] ?? "";
    const { error } = await supabase
      .from("submissions")
      .update({ notes: next.trim() || null })
      .eq("id", sub.id)
      .eq("student_id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    setEditingSub(({ [a.id]: _drop, ...rest }) => rest);
    await load();
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="Class" role={profile.role} email={profile.email} onSignOut={signOut} />
      <div className="mx-auto max-w-5xl px-6 py-6">
        <BackButton to="/student/dashboard" />
      </div>
      <main className="mx-auto max-w-5xl px-6 pb-16">
        {loading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : !cls ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            Class not found.
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--color-parchment)] px-3 py-1 font-mono text-xs">
                {cls.class_code}
              </div>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
                {cls.title}
              </h1>
              {cls.teacher_name && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Teacher: <span className="font-medium text-foreground">{cls.teacher_name}</span>
                </p>
              )}
              {cls.grade && <p className="mt-1 text-sm text-muted-foreground">{cls.grade}</p>}
              {cls.description && <p className="mt-2 text-muted-foreground">{cls.description}</p>}
            </div>

            <h2 className="mb-4 font-display text-2xl text-foreground">Assignments</h2>
            {assignments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
                No assignments yet.
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((a) => {
                  const sub = submissions[a.id];
                  const draft = drafts[a.id] ?? { notes: "", file: null };
                  return (
                    <div key={a.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-display text-lg text-foreground">{a.title}</h3>
                          {a.due_date && (
                            <p className="text-xs text-muted-foreground">
                              Due {new Date(a.due_date).toLocaleString()}
                            </p>
                          )}
                        </div>
                        {sub && (
                          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            Submitted
                          </span>
                        )}
                      </div>
                      {a.description && (
                        <p className="mt-2 text-sm text-muted-foreground">{a.description}</p>
                      )}
                      {a.media_url && (
                        <button
                          onClick={() => openFile(a.media_url!)}
                          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-ember)] hover:underline"
                        >
                          <FileText className="h-4 w-4" /> Attached material
                        </button>
                      )}
                      {a.link_url && (
                        <div className="mt-3">
                          <LinkPreview url={a.link_url} title={a.title} />
                        </div>
                      )}

                      {sub ? (
                        <div className="mt-4 rounded-lg border border-border bg-background p-3">
                          {editingSub[a.id] !== undefined ? (
                            <div className="space-y-2">
                              <textarea
                                value={editingSub[a.id]}
                                rows={2}
                                onChange={(e) => setEditingSub({ ...editingSub, [a.id]: e.target.value })}
                                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => saveEditedNotes(a)}
                                  className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() =>
                                    setEditingSub(({ [a.id]: _drop, ...rest }) => rest)
                                  }
                                  className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-foreground"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            sub.notes && <p className="text-sm text-foreground">{sub.notes}</p>
                          )}
                          {sub.file_url && (
                            <button
                              onClick={() => openFile(sub.file_url!)}
                              className="mt-2 text-sm font-medium text-[var(--color-ember)] hover:underline"
                            >
                              Open your file
                            </button>
                          )}
                          <p className="mt-2 text-xs text-muted-foreground">
                            Submitted {new Date(sub.submitted_at).toLocaleString()}
                          </p>
                          {!sub.grade && editingSub[a.id] === undefined && (
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => setEditingSub({ ...editingSub, [a.id]: sub.notes ?? "" })}
                                className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground transition hover:bg-secondary"
                              >
                                Edit notes
                              </button>
                              <button
                                onClick={() => deleteSubmission(a)}
                                className="rounded-full border border-border px-3 py-1 text-xs font-medium text-destructive transition hover:border-destructive/50"
                              >
                                Delete submission
                              </button>
                            </div>
                          )}
                          {sub.grade && (
                            <div className="mt-2 border-t border-border pt-2">
                              <p className="text-sm">
                                <span className="text-muted-foreground">Grade:</span>{" "}
                                <span className="font-medium text-foreground">{sub.grade}</span>
                              </p>
                              {sub.feedback && (
                                <p className="mt-1 text-sm text-muted-foreground">{sub.feedback}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-4 space-y-2">
                          <textarea
                            placeholder="Notes for your teacher"
                            rows={2}
                            value={draft.notes}
                            onChange={(e) =>
                              setDrafts({ ...drafts, [a.id]: { ...draft, notes: e.target.value } })
                            }
                            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm"
                          />
                          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                            <Upload className="h-4 w-4" />
                            <span className="truncate">
                              {draft.file ? draft.file.name : "Attach a file (optional)"}
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) =>
                                setDrafts({
                                  ...drafts,
                                  [a.id]: { ...draft, file: e.target.files?.[0] ?? null },
                                })
                              }
                            />
                          </label>
                          <button
                            onClick={() => submitWork(a)}
                            disabled={submitting === a.id}
                            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                          >
                            {submitting === a.id ? "Submitting…" : "Submit work"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {cls?.teacher_id && user && (
              <div className="mt-8">
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Private chat with {cls.teacher_name || "your teacher"}
                  </span>
                </div>
                <DirectMessagePanel
                  classCode={classCode}
                  teacherId={cls.teacher_id}
                  studentId={user.id}
                  currentUserId={user.id}
                  otherName={cls.teacher_name || "teacher"}
                />
              </div>
            )}

            <div className="mt-8">
              <ClassChat classCode={classCode} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
