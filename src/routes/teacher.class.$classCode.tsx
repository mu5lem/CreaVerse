import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Users, Upload, MessageSquare, X, CalendarIcon, Pencil, Trash2 } from "lucide-react";
import { ClassChat } from "@/components/ClassChat";
import { LinkPreview } from "@/components/LinkPreview";
import { DirectMessagePanel } from "@/components/DirectMessagePanel";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "@tanstack/react-router";
import { QuizBuilder } from "@/components/QuizBuilder";
import type { Question } from "@/lib/quiz-types";
import { totalPoints } from "@/lib/quiz-types";
import { StudentReportDialog } from "@/components/StudentReportDialog";

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
  assignment_kind: string;
  questions: Question[] | null;
  total_marks: number | null;
}
interface StudentRow {
  student_id: string;
  enrolled_at: string;
  email: string | null;
  full_name: string | null;
  suspended?: boolean;
}
interface EnrollmentRequest {
  id: string;
  class_code: string;
  student_id: string;
  kind: "leave" | "reactivate";
  reason: string | null;
  status: "pending" | "approved" | "denied";
  created_at: string;
  student_email?: string | null;
  student_name?: string | null;
}

function ClassDetail() {
  const { classCode } = Route.useParams();
  const { profile, signOut, user } = useAuth();
  const [cls, setCls] = useState<ClassRow | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", description: "", link_url: "" });
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [dueTime, setDueTime] = useState<string>("23:59");
  const [file, setFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [dmStudent, setDmStudent] = useState<StudentRow | null>(null);
  const [editingClass, setEditingClass] = useState(false);
  const [classDraft, setClassDraft] = useState({ title: "", class_code: "", grade: "", description: "" });
  const [savingClass, setSavingClass] = useState(false);
  const [deleteClassOpen, setDeleteClassOpen] = useState(false);
  const [deletingClass, setDeletingClass] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [asnDraft, setAsnDraft] = useState({ title: "", description: "", link_url: "" });
  const [asnDueDate, setAsnDueDate] = useState<Date | undefined>(undefined);
  const [asnDueTime, setAsnDueTime] = useState<string>("23:59");
  const [savingAsn, setSavingAsn] = useState(false);
  const [pendingDeleteAsn, setPendingDeleteAsn] = useState<Assignment | null>(null);
  const [deletingAsn, setDeletingAsn] = useState(false);
  const [asnKind, setAsnKind] = useState<"plain" | "quiz">("plain");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editAsnKind, setEditAsnKind] = useState<"plain" | "quiz">("plain");
  const [editQuestions, setEditQuestions] = useState<Question[]>([]);
  const [reportStudent, setReportStudent] = useState<StudentRow | null>(null);
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [suspendedMap, setSuspendedMap] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: c }, { data: enr }, { data: asn }, { data: reqs }] = await Promise.all([
      supabase.from("classes").select("*").eq("class_code", classCode).eq("teacher_id", user.id).maybeSingle(),
      supabase.from("enrollments").select("student_id, enrolled_at, suspended").eq("class_code", classCode),
      supabase.from("assignments").select("*").eq("class_code", classCode).order("created_at", { ascending: false }),
      supabase.from("enrollment_requests").select("*").eq("class_code", classCode).eq("status", "pending").order("created_at", { ascending: false }),
    ]);
    setCls((c as ClassRow | null) ?? null);
    setAssignments((asn ?? []) as Assignment[]);

    const enrRows = (enr ?? []) as { student_id: string; enrolled_at: string; suspended: boolean }[];
    const susMap: Record<string, boolean> = {};
    enrRows.forEach((e) => { susMap[e.student_id] = !!e.suspended; });
    setSuspendedMap(susMap);
    const reqRows = (reqs ?? []) as EnrollmentRequest[];

    const allIds = Array.from(new Set([...enrRows.map((e) => e.student_id), ...reqRows.map((r) => r.student_id)]));
    let profMap = new Map<string, { email: string | null; full_name: string | null }>();
    if (allIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", allIds);
      profMap = new Map((profs ?? []).map((p) => [p.id, { email: p.email ?? null, full_name: (p as { full_name?: string | null }).full_name ?? null }]));
    }
    setStudents(
      enrRows.map((e) => {
        const p = profMap.get(e.student_id);
        return { ...e, email: p?.email ?? null, full_name: p?.full_name ?? null, suspended: e.suspended };
      }),
    );
    setRequests(
      reqRows.map((r) => {
        const p = profMap.get(r.student_id);
        return { ...r, student_email: p?.email ?? null, student_name: p?.full_name ?? null };
      }),
    );
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
      let dueIso: string | null = null;
      if (dueDate) {
        const [hh, mm] = (dueTime || "23:59").split(":").map((v) => parseInt(v, 10));
        const d = new Date(dueDate);
        d.setHours(Number.isFinite(hh) ? hh : 23, Number.isFinite(mm) ? mm : 59, 0, 0);
        if (Number.isNaN(d.getTime())) throw new Error("Invalid due date");
        dueIso = d.toISOString();
      }
      if (asnKind === "quiz" && questions.length === 0) throw new Error("Add at least one question");
      const { data: created, error } = await supabase
        .from("assignments")
        .insert({
          class_code: classCode,
          title: form.title.trim(),
          description: form.description.trim() || null,
          link_url: asnKind === "quiz" ? null : (form.link_url.trim() || null),
          due_date: dueIso,
          assignment_kind: asnKind,
          questions: asnKind === "quiz" ? (JSON.parse(JSON.stringify(questions))) : null,
          total_marks: asnKind === "quiz" ? totalPoints(questions) : null,
        })
        .select("*")
        .single();
      if (error) throw error;

      if (asnKind === "plain" && file && created) {
        const path = `assignments/${classCode}/${created.id}/${file.name}`;
        const { error: upErr } = await supabase.storage
          .from("classroom-files")
          .upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        await supabase.from("assignments").update({ media_url: path }).eq("id", created.id);
      }
      toast.success(asnKind === "quiz" ? "Quiz published" : "Assignment created");
      setForm({ title: "", description: "", link_url: "" });
      setDueDate(undefined);
      setDueTime("23:59");
      setFile(null);
      setQuestions([]);
      setAsnKind("plain");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  const openEditClass = () => {
    if (!cls) return;
    setClassDraft({
      title: cls.title,
      class_code: cls.class_code,
      grade: cls.grade ?? "",
      description: cls.description ?? "",
    });
    setEditingClass(true);
  };

  const saveClass = async () => {
    if (!cls || !user) return;
    const newCode = classDraft.class_code.trim().toUpperCase();
    const newTitle = classDraft.title.trim();
    if (!newCode || !newTitle) return toast.error("Title and class code are required");
    setSavingClass(true);
    const { error } = await supabase
      .from("classes")
      .update({
        title: newTitle,
        class_code: newCode,
        grade: classDraft.grade.trim() || null,
        description: classDraft.description.trim() || null,
      })
      .eq("id", cls.id)
      .eq("teacher_id", user.id);
    setSavingClass(false);
    if (error) return toast.error(error.message);
    toast.success("Class updated");
    setEditingClass(false);
    if (newCode !== cls.class_code) {
      navigate({ to: "/teacher/class/$classCode", params: { classCode: newCode } });
    } else {
      await load();
    }
  };

  const confirmDeleteClass = async () => {
    if (!cls || !user) return;
    setDeletingClass(true);
    const { error } = await supabase
      .from("classes")
      .delete()
      .eq("id", cls.id)
      .eq("teacher_id", user.id);
    setDeletingClass(false);
    setDeleteClassOpen(false);
    if (error) return toast.error(error.message);
    toast.success("Class deleted");
    navigate({ to: "/teacher/dashboard" });
  };

  const openEditAssignment = (a: Assignment) => {
    setAsnDraft({ title: a.title, description: a.description ?? "", link_url: a.link_url ?? "" });
    if (a.due_date) {
      const d = new Date(a.due_date);
      setAsnDueDate(d);
      setAsnDueTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
    } else {
      setAsnDueDate(undefined);
      setAsnDueTime("23:59");
    }
    setEditAsnKind(a.assignment_kind === "quiz" ? "quiz" : "plain");
    setEditQuestions(Array.isArray(a.questions) ? (a.questions as Question[]) : []);
    setEditingAssignment(a);
  };

  const saveAssignment = async () => {
    if (!editingAssignment) return;
    const title = asnDraft.title.trim();
    if (!title) return toast.error("Title is required");
    let dueIso: string | null = null;
    if (asnDueDate) {
      const [hh, mm] = (asnDueTime || "23:59").split(":").map((v) => parseInt(v, 10));
      const d = new Date(asnDueDate);
      d.setHours(Number.isFinite(hh) ? hh : 23, Number.isFinite(mm) ? mm : 59, 0, 0);
      dueIso = d.toISOString();
    }
    if (editAsnKind === "quiz" && editQuestions.length === 0) return toast.error("Add at least one question");
    setSavingAsn(true);
    const { error } = await supabase
      .from("assignments")
      .update({
        title,
        description: asnDraft.description.trim() || null,
        link_url: editAsnKind === "quiz" ? null : (asnDraft.link_url.trim() || null),
        due_date: dueIso,
        assignment_kind: editAsnKind,
        questions: editAsnKind === "quiz" ? JSON.parse(JSON.stringify(editQuestions)) : null,
        total_marks: editAsnKind === "quiz" ? totalPoints(editQuestions) : null,
      })
      .eq("id", editingAssignment.id);
    setSavingAsn(false);
    if (error) return toast.error(error.message);
    toast.success("Assignment updated");
    setEditingAssignment(null);
    await load();
  };

  const decideRequest = async (r: EnrollmentRequest, status: "approved" | "denied") => {
    if (!user) return;
    // If leave approved → delete enrollment. If reactivate approved → set suspended=false.
    if (status === "approved") {
      if (r.kind === "leave") {
        const { error } = await supabase.from("enrollments").delete().eq("class_code", r.class_code).eq("student_id", r.student_id);
        if (error) return toast.error(error.message);
      } else {
        const { error } = await supabase.from("enrollments").update({ suspended: false }).eq("class_code", r.class_code).eq("student_id", r.student_id);
        if (error) return toast.error(error.message);
      }
    }
    const { error: rErr } = await supabase
      .from("enrollment_requests")
      .update({ status, decided_by: user.id, decided_at: new Date().toISOString() })
      .eq("id", r.id);
    if (rErr) return toast.error(rErr.message);
    toast.success(status === "approved" ? "Approved" : "Denied");
    await load();
  };

  const confirmDeleteAssignment = async () => {
    if (!pendingDeleteAsn) return;
    setDeletingAsn(true);
    const { error } = await supabase.from("assignments").delete().eq("id", pendingDeleteAsn.id);
    setDeletingAsn(false);
    setPendingDeleteAsn(null);
    if (error) return toast.error(error.message);
    toast.success("Assignment deleted");
    await load();
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
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--color-parchment)] px-3 py-1 font-mono text-xs text-foreground">
                  {cls.class_code}
                </div>
                <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
                  {cls.title}
                </h1>
                {cls.grade && <p className="mt-1 text-sm text-muted-foreground">{cls.grade}</p>}
                {cls.description && <p className="mt-2 text-muted-foreground">{cls.description}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={openEditClass}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-[var(--color-ember)]/60"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteClassOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-destructive/60 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
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
                          <button
                            type="button"
                            onClick={() => setReportStudent(s)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <div className="truncate font-medium text-foreground hover:text-[var(--color-ember)]">
                              {displayName}{s.suspended && <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] text-destructive">suspended</span>}
                            </div>
                            {s.full_name && s.email && (
                              <div className="truncate text-xs text-muted-foreground">{s.email}</div>
                            )}
                            <div className="text-[10px] text-muted-foreground">
                              Joined {new Date(s.enrolled_at).toLocaleDateString()}
                            </div>
                          </button>
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

              {/* Enrollment requests */}
              {requests.length > 0 && (
                <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="mb-3 font-display text-lg text-foreground">Pending student requests</h2>
                  <ul className="space-y-2 text-sm">
                    {requests.map((r) => (
                      <li key={r.id} className="rounded-lg border border-border bg-background p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium text-foreground">
                              {r.student_name || r.student_email || r.student_id} —{" "}
                              <span className="text-[var(--color-ember)]">{r.kind === "leave" ? "Requesting to leave" : "Requesting reactivation"}</span>
                            </div>
                            {r.reason && <div className="mt-1 text-xs text-muted-foreground">Reason: {r.reason}</div>}
                            <div className="mt-1 text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button onClick={() => decideRequest(r, "approved")} className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90">Approve</button>
                            <button onClick={() => decideRequest(r, "denied")} className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:border-destructive hover:text-destructive">Deny</button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
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
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "flex-1 inline-flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-left text-sm",
                            !dueDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="h-4 w-4" />
                          {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={setDueDate}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <input
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="w-32 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                    {dueDate && (
                      <button
                        type="button"
                        onClick={() => setDueDate(undefined)}
                        className="rounded-lg border border-input px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                        title="Clear due date"
                      >
                        Clear
                      </button>
                    )}
                  </div>
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
                        <div className="group flex items-start gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm transition hover:border-[var(--color-ember)]/50">
                          <Link
                            to="/teacher/assignment/$assignmentId"
                            params={{ assignmentId: a.id }}
                            className="min-w-0 flex-1"
                          >
                            <div className="truncate font-medium text-foreground">{a.title}</div>
                            {a.due_date && (
                              <div className="text-xs text-muted-foreground">
                                Due {new Date(a.due_date).toLocaleString()}
                              </div>
                            )}
                          </Link>
                          <div className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              onClick={() => openEditAssignment(a)}
                              title="Edit assignment"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDeleteAsn(a)}
                              title="Delete assignment"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
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

      {/* Edit class dialog */}
      {editingClass && cls && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !savingClass && setEditingClass(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="font-display text-lg text-foreground">Edit class</div>
              <button onClick={() => setEditingClass(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Class title" value={classDraft.title} onChange={(e) => setClassDraft({ ...classDraft, title: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              <input placeholder="Class code" value={classDraft.class_code} onChange={(e) => setClassDraft({ ...classDraft, class_code: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm uppercase" />
              <input placeholder="Grade / level (optional)" value={classDraft.grade} onChange={(e) => setClassDraft({ ...classDraft, grade: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              <textarea placeholder="Description (optional)" value={classDraft.description} onChange={(e) => setClassDraft({ ...classDraft, description: e.target.value })} rows={3} className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setEditingClass(false)} disabled={savingClass} className="rounded-full border border-border px-4 py-2 text-sm">Cancel</button>
                <button onClick={saveClass} disabled={savingClass} className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">{savingClass ? "Saving…" : "Save"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit assignment dialog */}
      {editingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !savingAsn && setEditingAssignment(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="font-display text-lg text-foreground">Edit assignment</div>
              <button onClick={() => setEditingAssignment(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Title" value={asnDraft.title} onChange={(e) => setAsnDraft({ ...asnDraft, title: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              <textarea placeholder="Instructions (optional)" value={asnDraft.description} onChange={(e) => setAsnDraft({ ...asnDraft, description: e.target.value })} rows={3} className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              <label className="block text-xs uppercase tracking-wider text-muted-foreground">Due date</label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className={cn("flex-1 inline-flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-left text-sm", !asnDueDate && "text-muted-foreground")}>
                      <CalendarIcon className="h-4 w-4" />
                      {asnDueDate ? format(asnDueDate, "PPP") : "Pick a date"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={asnDueDate} onSelect={setAsnDueDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
                <input type="time" value={asnDueTime} onChange={(e) => setAsnDueTime(e.target.value)} className="w-32 rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                {asnDueDate && (
                  <button type="button" onClick={() => setAsnDueDate(undefined)} className="rounded-lg border border-input px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Clear</button>
                )}
              </div>
              <input type="url" placeholder="Attach a link (optional)" value={asnDraft.link_url} onChange={(e) => setAsnDraft({ ...asnDraft, link_url: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setEditingAssignment(null)} disabled={savingAsn} className="rounded-full border border-border px-4 py-2 text-sm">Cancel</button>
                <button onClick={saveAssignment} disabled={savingAsn} className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">{savingAsn ? "Saving…" : "Save"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={deleteClassOpen} onOpenChange={(o) => !o && setDeleteClassOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this class?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the class, its enrollments, assignments and submissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingClass}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmDeleteClass(); }} disabled={deletingClass} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletingClass ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!pendingDeleteAsn} onOpenChange={(o) => !o && setPendingDeleteAsn(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteAsn && <>Delete <span className="font-medium text-foreground">"{pendingDeleteAsn.title}"</span>? This also removes all submissions for it.</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAsn}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmDeleteAssignment(); }} disabled={deletingAsn} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletingAsn ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
