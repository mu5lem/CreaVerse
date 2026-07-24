import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { X, ShieldOff, ShieldCheck, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onClose: () => void;
  classCode: string;
  student: { student_id: string; email: string | null; full_name: string | null; suspended?: boolean };
  onChanged?: () => void;
}

interface AssignmentLite { id: string; title: string; total_marks: number | null }
interface SubmissionLite { id: string; assignment_id: string; grade: string | null; percentage: number | null; obtained_marks: number | null; submitted_at: string }

export function StudentReportDialog({ open, onClose, classCode, student, onChanged }: Props) {
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState<AssignmentLite[]>([]);
  const [subs, setSubs] = useState<SubmissionLite[]>([]);
  const [suspended, setSuspended] = useState(!!student.suspended);
  const [busy, setBusy] = useState(false);
  const [enrolledAt, setEnrolledAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    const [{ data: enr }, { data: asn }] = await Promise.all([
      supabase.from("enrollments").select("suspended, enrolled_at").eq("class_code", classCode).eq("student_id", student.student_id).maybeSingle(),
      supabase.from("assignments").select("id, title, total_marks").eq("class_code", classCode).order("created_at", { ascending: false }),
    ]);
    setSuspended(!!enr?.suspended);
    setEnrolledAt(enr?.enrolled_at ?? null);
    const list = (asn ?? []) as AssignmentLite[];
    setAssignments(list);
    if (list.length > 0) {
      const { data: s } = await supabase.from("submissions").select("id, assignment_id, grade, percentage, obtained_marks, submitted_at").in("assignment_id", list.map((a) => a.id)).eq("student_id", student.student_id);
      setSubs((s ?? []) as SubmissionLite[]);
    } else setSubs([]);
    setLoading(false);
  }, [open, classCode, student.student_id]);

  useEffect(() => { load(); }, [load]);

  const toggleSuspend = async () => {
    setBusy(true);
    const { error } = await supabase.from("enrollments").update({ suspended: !suspended }).eq("class_code", classCode).eq("student_id", student.student_id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(!suspended ? "Student suspended" : "Student reactivated");
    setSuspended(!suspended);
    onChanged?.();
  };

  const removeStudent = async () => {
    if (!window.confirm("Remove this student from the class? They will need a new invite to rejoin.")) return;
    setBusy(true);
    const { error } = await supabase.from("enrollments").delete().eq("class_code", classCode).eq("student_id", student.student_id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Student removed");
    onChanged?.();
    onClose();
  };

  const displayName = student.full_name?.trim() || student.email || student.student_id;
  const submittedCount = subs.length;
  const gradedPercents = subs
    .map((s) => (typeof s.percentage === "number" ? s.percentage : (s.grade ? parseFloat(s.grade) : NaN)))
    .filter((v) => Number.isFinite(v)) as number[];
  const avg = gradedPercents.length ? gradedPercents.reduce((a, b) => a + b, 0) / gradedPercents.length : null;
  const atRisk = avg !== null && avg < 60;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Student report</div>
            <div className="font-display text-xl text-foreground">{displayName}</div>
            {student.full_name && student.email && (
              <div className="text-xs text-muted-foreground">{student.email}</div>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {suspended && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              This student is currently suspended and cannot access the class.
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Submitted" value={`${submittedCount} / ${assignments.length}`} />
            <Stat label="Avg. grade" value={avg !== null ? `${Math.round(avg)}%` : "—"} tone={atRisk ? "danger" : "neutral"} />
            <Stat label="Enrolled" value={enrolledAt ? new Date(enrolledAt).toLocaleDateString() : "—"} />
          </div>

          <div>
            <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Assignments</div>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : assignments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">No assignments yet.</div>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {assignments.map((a) => {
                  const s = subs.find((x) => x.assignment_id === a.id);
                  return (
                    <li key={a.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div className="min-w-0 flex-1 truncate text-foreground">{a.title}</div>
                      <div className="shrink-0 text-xs">
                        {!s ? (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">Not submitted</span>
                        ) : s.grade || s.percentage !== null ? (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700">
                            {typeof s.percentage === "number" ? `${Math.round(s.percentage)}%` : s.grade}
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-700">Awaiting grade</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <button
              onClick={toggleSuspend}
              disabled={busy}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${suspended ? "bg-emerald-600 text-white hover:opacity-90" : "border border-border text-foreground hover:border-amber-500/60 hover:text-amber-700"}`}
            >
              {suspended ? <><ShieldCheck className="h-4 w-4" /> Reactivate</> : <><ShieldOff className="h-4 w-4" /> Suspend</>}
            </button>
            <button
              onClick={removeStudent}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-destructive transition hover:border-destructive/60 disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" /> Remove from class
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "danger" | "neutral" }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-2xl ${tone === "danger" ? "text-destructive" : "text-foreground"}`}>{value}</div>
    </div>
  );
}
