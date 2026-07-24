import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Users, Upload, MessageSquare, X } from "lucide-react";
import { ClassChat } from "@/components/ClassChat";
import { LinkPreview } from "@/components/LinkPreview";
import { DirectMessagePanel } from "@/components/DirectMessagePanel";

export const Route = createFileRoute("/teacher/class/$classCode")({
  component: () => (
    <ProtectedRoute role="teacher">
      <ClassDetail />
    </ProtectedRoute>
  ),
});

interface ClassRow {
  id: string;
  class_code: string;
  title: string;
  grade: string | null;
  description: string | null;
}
interface Assignment {
  id: string;
  title: string;
  description: string | null;
  media_url: string | null;
  link_url: string | null;
  due_date: string | null;
  created_at: string;
}
interface StudentRow {
  student_id: string;
  enrolled_at: string;
  email: string | null;
  full_name: string | null;
}

function ClassDetail() {
  const { classCode } = Route.useParams();
  const { profile, signOut, user } = useAuth();
  const [cls, setCls] = useState<ClassRow | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", description: "", due_date: "", link_url: "" });
  const [file, setFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [dmStudent, setDmStudent] = useState<StudentRow | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: c }, { data: enr }, { data: asn }] = await Promise.all([
      supabase.from("classes").select("*").eq("class_code", classCode).eq("teacher_id", user.id).maybeSingle(),
      supabase.from("enrollments").select("student_id, enrolled_at").eq("class_code", classCode),
      supabase.from("assignments").select("*").eq("class_code", classCode).order("created_at", { ascending: false }),
    ]);
    setCls((c as ClassRow | null) ?? null);
    setAssignments((asn ?? []) as Assignment[]);

    const enrRows = (enr ?? []) as { student_id: string; enrolled_at: string }[];
    if (enrRows.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", enrRows.map((e) => e.student_id));
      const profMap = new Map((profs ?? []).map((p) => [p.id, p]));
      setStudents(
        enrRows.map((e) => {
          const p = profMap.get(e.student_id);
          return {
            ...e,
            email: p?.email ?? null,
            full_name: (p as { full_name?: string | null } | undefined)?.full_name ?? null,
          };
        }),
      );
    } else {
      setStudents([]);
    }
    setLoading(false);
  }, [user, classCode]);

  useEffect(() => {
    load();
  }, [load]);

  const createAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating || !form.title.trim()) return;
    setCreating(true);
    try {
      const { data: created, error } = await supabase
        .from("assignments")
        .insert({
          class_code: classCode,
          title: form.title.trim(),
          description: form.description.trim() || null,
          link_url: form.link_url.trim() || null,
          due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        })
        .select("*")
        .single();
      if (error) throw error;

      if (file && created) {
        const path = `assignments/${classCode}/${created.id}/${file.name}`;
        const { error: upErr } = await supabase.storage
          .from("classroom-files")
          .upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        await supabase.from("assignments").update({ media_url: path }).eq("id", created.id);
      }
      toast.success("Assignment created");
      setForm({ title: "", description: "", due_date: "", link_url: "" });
      setFile(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="Class" role={profile.role} email={profile.email} onSignOut={signOut} />
      <div className="mx-auto max-w-6xl px-6 py-6">
        <BackButton to="/teacher/dashboard" />
      </div>
      <main className="mx-auto max-w-6xl px-6 pb-16">
        {loading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : !cls ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            Class not found.
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--color-parchment)] px-3 py-1 font-mono text-xs text-foreground">
                {cls.class_code}
              </div>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
                {cls.title}
              </h1>
              {cls.grade && <p className="mt-1 text-sm text-muted-foreground">{cls.grade}</p>}
              {cls.description && <p className="mt-2 text-muted-foreground">{cls.description}</p>}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Students */}
              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-display text-lg text-foreground">Enrolled students</h2>
                </div>
                {students.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No students yet. Share the code <span className="font-mono">{cls.class_code}</span>.
                  </p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {students.map((s) => {
                      const displayName = s.full_name?.trim() || s.email || s.student_id;
                      return (
                        <li key={s.student_id} className="flex items-center justify-between gap-2 rounded-lg bg-[var(--color-parchment)]/50 px-3 py-2">
                          <div className="min-w-0">
                            <div className="truncate font-medium text-foreground">{displayName}</div>
                            {s.full_name && s.email && (
                              <div className="truncate text-xs text-muted-foreground">{s.email}</div>
                            )}
                            <div className="text-[10px] text-muted-foreground">
                              Joined {new Date(s.enrolled_at).toLocaleDateString()}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDmStudent(s)}
                            title="Send private message"
                            className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition hover:border-[var(--color-ember)]/60 hover:text-[var(--color-ember)]"
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> Message
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* Create assignment */}
              <form onSubmit={createAssignment} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-display text-lg text-foreground">New assignment</h2>
                </div>
                <div className="space-y-3">
                  <input
                    required
                    placeholder="Title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                  <textarea
                    placeholder="Instructions (optional)"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                  <label className="block text-xs uppercase tracking-wider text-muted-foreground">
                    Due date
                  </label>
                  <input
                    type="datetime-local"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="url"
                    placeholder="Attach a link (optional) — https://…"
                    value={form.link_url}
                    onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                  {form.link_url.trim() && (
                    <LinkPreview url={form.link_url.trim()} title={form.title.trim() || undefined} />
                  )}
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                    <Upload className="h-4 w-4" />
                    <span className="truncate">{file ? file.name : "Attach a file (optional)"}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                  >
                    {creating ? "Creating…" : "Publish assignment"}
                  </button>
                </div>
              </form>

              {/* Assignments list */}
              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-display text-lg text-foreground">Assignments</h2>
                </div>
                {assignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {assignments.map((a) => (
                      <li key={a.id} className="space-y-2">
                        <Link
                          to="/teacher/assignment/$assignmentId"
                          params={{ assignmentId: a.id }}
                          className="block rounded-lg border border-border bg-background px-3 py-2 text-sm transition hover:border-[var(--color-ember)]/50"
                        >
                          <div className="font-medium text-foreground">{a.title}</div>
                          {a.due_date && (
                            <div className="text-xs text-muted-foreground">
                              Due {new Date(a.due_date).toLocaleString()}
                            </div>
                          )}
                        </Link>
                        {a.link_url && <LinkPreview url={a.link_url} title={a.title} />}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <div className="mt-6">
              <ClassChat classCode={classCode} />
            </div>
          </>
        )}
      </main>

      {dmStudent && cls && user && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setDmStudent(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-4 shadow-xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Private message</div>
                <div className="font-display text-lg text-foreground">
                  {dmStudent.full_name?.trim() || dmStudent.email || "Student"}
                </div>
              </div>
              <button
                onClick={() => setDmStudent(null)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <DirectMessagePanel
              classCode={cls.class_code}
              teacherId={user.id}
              studentId={dmStudent.student_id}
              currentUserId={user.id}
              otherName={dmStudent.full_name?.trim() || dmStudent.email || "student"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
