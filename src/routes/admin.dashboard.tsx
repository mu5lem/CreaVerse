import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BackButton } from "@/components/BackButton";
import { QuickNav } from "@/components/QuickNav";
import { useAuth, type Role } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Users, GraduationCap, School, Star, Ticket, Plus, Trash2, Activity } from "lucide-react";
import { useConfirm } from "@/components/ConfirmDialog";

export const Route = createFileRoute("/admin/dashboard")({
  component: () => (
    <ProtectedRoute role="admin">
      <AdminDashboard />
    </ProtectedRoute>
  ),
});

interface Row {
  id: string;
  email: string;
  role: Role;
  is_suspended: boolean;
  full_name: string | null;
  gender: string | null;
  school: string | null;
}

function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; rating: number; comments: string | null; created_at: string; email: string }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, role, is_suspended, full_name, gender, school")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows((data ?? []) as Row[]);

    const { data: fb } = await supabase
      .from("feedback")
      .select("id, rating, comments, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(50);
    const uids = [...new Set((fb ?? []).map((f) => f.user_id))];
    let emails = new Map<string, string>();
    if (uids.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("id, email").in("id", uids);
      emails = new Map((profs ?? []).map((p) => [p.id, p.email]));
    }
    setFeedback(
      (fb ?? []).map((f) => ({
        id: f.id,
        rating: f.rating,
        comments: f.comments,
        created_at: f.created_at,
        email: emails.get(f.user_id) ?? f.user_id,
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (r: Row, next: { role?: Role; is_suspended?: boolean }) => {
    setBusyId(r.id);
    try {
      const { error } = await supabase.rpc("admin_set_user_status", {
        target_user_id: r.id,
        new_role: next.role ?? r.role,
        new_is_suspended: next.is_suspended ?? r.is_suspended,
      });
      if (error) throw error;
      toast.success("Updated");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        title="Admin Console"
        role={profile.role}
        email={profile.email}
        onSignOut={signOut}
      />

      <div className="mx-auto max-w-6xl px-6 py-6">
        <BackButton to="/" />
      </div>

      <main className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
            Users
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage roles and suspend accounts. All actions go through secure RPCs.
          </p>
        </div>

        <QuickNav />

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Users", value: rows.length, icon: Users },
            { label: "Teachers", value: rows.filter((r) => r.role === "teacher").length, icon: School },
            { label: "Students", value: rows.filter((r) => r.role === "student").length, icon: GraduationCap },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <s.icon className="h-4 w-4" /> {s.label}
              </div>
              <div className="font-display text-3xl text-foreground">{s.value}</div>
            </div>
          ))}
        </div>


        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-parchment)] text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Gender</th>
                  <th className="px-4 py-3 font-medium">School / College</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Loading users…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No users yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3 text-foreground">{r.full_name ?? "—"}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{r.email}</td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">{r.gender ? r.gender.replace(/_/g, " ") : "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.school ?? "—"}</td>
                      <td className="px-4 py-3">
                        <select
                          value={r.role}
                          disabled={busyId === r.id}
                          onChange={(e) =>
                            setStatus(r, { role: e.target.value as Role })
                          }
                          className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                        >
                          <option value="student">student</option>
                          <option value="teacher">teacher</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {r.is_suspended ? (
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                            Suspended
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          disabled={busyId === r.id}
                          onClick={() =>
                            setStatus(r, { is_suspended: !r.is_suspended })
                          }
                          className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground transition hover:bg-secondary disabled:opacity-60"
                        >
                          {r.is_suspended ? "Activate" : "Suspend"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <InviteCodesSection />

        <TeacherRequestsSection />

        <TeacherActivitySection />

        <OnboardingResponsesSection />





        <div className="mt-10">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4 text-[var(--color-ember)]" />
            <span className="font-medium text-foreground">Recent Feedback</span>
          </div>
          {feedback.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
              No feedback submitted yet.
            </div>
          ) : (
            <ul className="space-y-3">
              {feedback.map((f) => (
                <li key={f.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{f.email}</span>
                    <span className="text-xs text-[var(--color-ember)]">
                      {"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}
                    </span>
                  </div>
                  {f.comments && (
                    <p className="mt-2 text-sm text-muted-foreground">{f.comments}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(f.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

interface InviteCode {
  id: string;
  code: string;
  role: string;
  max_uses: number;
  uses: number;
  expires_at: string | null;
  active: boolean;
}

function InviteCodesSection() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [maxUses, setMaxUses] = useState(10);
  const [expiresInDays, setExpiresInDays] = useState<number | "">(30);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("invite_codes")
      .select("id, code, role, max_uses, uses, expires_at, active")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setCodes((data ?? []) as InviteCode[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const generateCode = () => {
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    setCode(`TEACH-${rand}`);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return toast.error("Enter or generate a code");
    if (maxUses < 1) return toast.error("Use limit must be at least 1");
    setCreating(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not authenticated");
      const expires_at =
        expiresInDays === "" || expiresInDays <= 0
          ? null
          : new Date(Date.now() + Number(expiresInDays) * 86400000).toISOString();
      const { error } = await supabase.from("invite_codes").insert({
        code: trimmed,
        role: "teacher",
        max_uses: maxUses,
        expires_at,
        active: true,
        created_by: uid,
      });
      if (error) throw error;
      toast.success("Invite code created");
      setCode("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create code");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (c: InviteCode) => {
    const { error } = await supabase
      .from("invite_codes")
      .update({ active: !c.active })
      .eq("id", c.id);
    if (error) toast.error(error.message);
    else await load();
  };

  const confirm = useConfirm();
  const remove = async (c: InviteCode) => {
    const ok = await confirm({
      title: "Delete invite code?",
      description: `Delete code ${c.code}? This cannot be undone.`,
      confirmText: "Delete",
      destructive: true,
    });
    if (!ok) return;
    const { error } = await supabase.from("invite_codes").delete().eq("id", c.id);
    if (error) toast.error(error.message);
    else await load();
  };

  return (
    <div className="mt-10">
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Ticket className="h-4 w-4 text-[var(--color-ember)]" />
        <span className="font-medium text-foreground">Teacher Invite Codes</span>
      </div>

      <form
        onSubmit={create}
        className="mb-4 grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:grid-cols-[1fr_120px_140px_auto]"
      >
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="TEACH-XXXXX"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
          />
          <button
            type="button"
            onClick={generateCode}
            className="rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary"
          >
            Generate
          </button>
        </div>
        <input
          type="number"
          min={1}
          value={maxUses}
          onChange={(e) => setMaxUses(Number(e.target.value))}
          placeholder="Use limit"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          type="number"
          min={0}
          value={expiresInDays}
          onChange={(e) => setExpiresInDays(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="Expires in days (blank = never)"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={creating}
          className="inline-flex items-center justify-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" /> Create
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-parchment)] text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Uses</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>
              ) : codes.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No invite codes yet.</td></tr>
              ) : codes.map((c) => {
                const expired = c.expires_at ? new Date(c.expires_at) < new Date() : false;
                const exhausted = c.uses >= c.max_uses;
                const usable = c.active && !expired && !exhausted;
                return (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-mono text-foreground">{c.code}</td>
                    <td className="px-4 py-3 text-foreground">{c.uses} / {c.max_uses}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      {usable ? (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700">Active</span>
                      ) : (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {!c.active ? "Disabled" : expired ? "Expired" : "Exhausted"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleActive(c)}
                          className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium hover:bg-secondary"
                        >
                          {c.active ? "Disable" : "Enable"}
                        </button>
                        <button
                          onClick={() => remove(c)}
                          className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-background px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface TeacherRequestRow {
  id: string;
  user_id: string;
  school_name: string | null;
  status: string;
  created_at: string;
  email: string;
  full_name: string | null;
}

function TeacherRequestsSection() {
  const [rows, setRows] = useState<TeacherRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("teacher_requests")
      .select("id, user_id, school_name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const uids = [...new Set((data ?? []).map((r) => r.user_id))];
    let profMap = new Map<string, { email: string; full_name: string | null }>();
    if (uids.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("id, email, full_name").in("id", uids);
      profMap = new Map((profs ?? []).map((p) => [p.id, { email: p.email, full_name: (p as { full_name?: string | null }).full_name ?? null }]));
    }
    setRows((data ?? []).map((r) => ({
      id: r.id,
      user_id: r.user_id,
      school_name: r.school_name,
      status: r.status,
      created_at: r.created_at,
      email: profMap.get(r.user_id)?.email ?? r.user_id,
      full_name: profMap.get(r.user_id)?.full_name ?? null,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const decide = async (r: TeacherRequestRow, status: "approved" | "denied") => {
    setBusyId(r.id);
    try {
      if (status === "approved") {
        const { error } = await supabase.rpc("admin_set_user_status", {
          target_user_id: r.user_id,
          new_role: "teacher",
          new_is_suspended: false,
        });
        if (error) throw error;
      }
      const { error: rErr } = await supabase
        .from("teacher_requests")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", r.id);
      if (rErr) throw rErr;
      toast.success(status === "approved" ? "Teacher request approved" : "Teacher request denied");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mt-10">
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <GraduationCap className="h-4 w-4 text-[var(--color-ember)]" />
        <span className="font-medium text-foreground">Teacher Requests</span>
        <span className="text-xs">— users who asked to become a teacher</span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-parchment)] text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Requester</th>
                <th className="px-4 py-3 font-medium">School</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Requested</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No teacher requests yet.</td></tr>
              ) : rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <div className="text-foreground">{r.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.email}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.school_name ?? "—"}</td>
                  <td className="px-4 py-3">
                    {r.status === "pending" ? (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700">Pending</span>
                    ) : r.status === "approved" ? (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700">Approved</span>
                    ) : (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">Denied</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {r.status === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => decide(r, "approved")}
                          disabled={busyId === r.id}
                          className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => decide(r, "denied")}
                          disabled={busyId === r.id}
                          className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:border-destructive hover:text-destructive disabled:opacity-60"
                        >
                          Deny
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface TeacherRow {
  id: string;
  email: string;
  full_name: string | null;
  classCount: number;
  assignmentCount: number;
  studentCount: number;
  lastActivity: string | null;
}

function TeacherActivitySection() {
  const [rows, setRows] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: teachers }, { data: classes }, { data: assignments }, { data: enrollments }, { data: chats }] = await Promise.all([
        supabase.from("profiles").select("id, email, full_name").eq("role", "teacher"),
        supabase.from("classes").select("class_code, teacher_id, created_at"),
        supabase.from("assignments").select("class_code, created_at"),
        supabase.from("enrollments").select("class_code, student_id"),
        supabase.from("chat_messages").select("class_code, created_at").order("created_at", { ascending: false }).limit(500),
      ]);

      const codesByTeacher = new Map<string, string[]>();
      (classes ?? []).forEach((c) => {
        const arr = codesByTeacher.get(c.teacher_id) ?? [];
        arr.push(c.class_code);
        codesByTeacher.set(c.teacher_id, arr);
      });
      const teacherByCode = new Map<string, string>();
      (classes ?? []).forEach((c) => teacherByCode.set(c.class_code, c.teacher_id));

      const lastByTeacher = new Map<string, number>();
      const bump = (tid: string | undefined, iso: string) => {
        if (!tid) return;
        const t = new Date(iso).getTime();
        if (!lastByTeacher.has(tid) || lastByTeacher.get(tid)! < t) lastByTeacher.set(tid, t);
      };
      (classes ?? []).forEach((c) => bump(c.teacher_id, c.created_at));
      (assignments ?? []).forEach((a) => bump(teacherByCode.get(a.class_code), a.created_at));
      (chats ?? []).forEach((m) => bump(teacherByCode.get(m.class_code), m.created_at));

      const assignmentCountByCode = new Map<string, number>();
      (assignments ?? []).forEach((a) => assignmentCountByCode.set(a.class_code, (assignmentCountByCode.get(a.class_code) ?? 0) + 1));

      const studentsByTeacher = new Map<string, Set<string>>();
      (enrollments ?? []).forEach((e) => {
        const tid = teacherByCode.get(e.class_code);
        if (!tid) return;
        const set = studentsByTeacher.get(tid) ?? new Set<string>();
        set.add(e.student_id);
        studentsByTeacher.set(tid, set);
      });

      const built: TeacherRow[] = (teachers ?? []).map((t) => {
        const codes = codesByTeacher.get(t.id) ?? [];
        const asgn = codes.reduce((n, code) => n + (assignmentCountByCode.get(code) ?? 0), 0);
        const last = lastByTeacher.get(t.id);
        return {
          id: t.id,
          email: t.email,
          full_name: t.full_name,
          classCount: codes.length,
          assignmentCount: asgn,
          studentCount: studentsByTeacher.get(t.id)?.size ?? 0,
          lastActivity: last ? new Date(last).toISOString() : null,
        };
      }).sort((a, b) => (b.lastActivity ?? "").localeCompare(a.lastActivity ?? ""));

      setRows(built);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="mt-10">
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Activity className="h-4 w-4 text-[var(--color-ember)]" />
        <span className="font-medium text-foreground">Teacher Activity</span>
        <span className="text-xs">— aggregated from classes, assignments, and chat</span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-parchment)] text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Teacher</th>
                <th className="px-4 py-3 font-medium">Classes</th>
                <th className="px-4 py-3 font-medium">Assignments</th>
                <th className="px-4 py-3 font-medium">Students</th>
                <th className="px-4 py-3 font-medium">Last activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No teachers yet.</td></tr>
              ) : rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <div className="text-foreground">{r.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.email}</div>
                  </td>
                  <td className="px-4 py-3 text-foreground">{r.classCount}</td>
                  <td className="px-4 py-3 text-foreground">{r.assignmentCount}</td>
                  <td className="px-4 py-3 text-foreground">{r.studentCount}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.lastActivity ? new Date(r.lastActivity).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface OnboardingRow {
  id: string;
  created_at: string;
  purpose: string | null;
  discovery_source: string | null;
  age_group: string | null;
  biggest_challenge: string | null;
  email: string;
}

function OnboardingResponsesSection() {
  const [rows, setRows] = useState<OnboardingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("onboarding_responses")
        .select("id, user_id, created_at, purpose, discovery_source, age_group, biggest_challenge")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      const uids = [...new Set((data ?? []).map((r) => r.user_id))];
      let emails = new Map<string, string>();
      if (uids.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("id, email").in("id", uids);
        emails = new Map((profs ?? []).map((p) => [p.id, p.email]));
      }
      setRows((data ?? []).map((r) => ({
        id: r.id,
        created_at: r.created_at,
        purpose: r.purpose,
        discovery_source: r.discovery_source,
        age_group: r.age_group,
        biggest_challenge: r.biggest_challenge,
        email: emails.get(r.user_id) ?? r.user_id,
      })));
      setLoading(false);
    })();
  }, []);

  return (
    <div className="mt-10">
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Star className="h-4 w-4 text-[var(--color-ember)]" />
        <span className="font-medium text-foreground">Onboarding survey responses</span>
        <span className="text-xs">— collected on first sign-in</span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-parchment)] text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Purpose</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Age group</th>
                <th className="px-4 py-3 font-medium">Goal for the next month</th>
                <th className="px-4 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No responses yet.</td></tr>
              ) : rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-foreground">{r.email}</td>
                  <td className="px-4 py-3 text-foreground">{r.purpose ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.discovery_source ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.age_group ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-md">{r.biggest_challenge ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

