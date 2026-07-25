import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Bell, KeyRound, Languages, Moon, ShieldAlert, Trash2, UserCog } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BackButton } from "@/components/BackButton";
import { useConfirm } from "@/components/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { deleteCurrentAccount } from "@/lib/account.functions";

type ThemePref = "system" | "light" | "dark";
type LangPref = "en" | "ur";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — CreaVerse" },
      { name: "description", content: "Manage your CreaVerse account, password, preferences, and notifications." },
      { property: "og:title", content: "Settings — CreaVerse" },
      { property: "og:description", content: "Manage CreaVerse preferences and account security." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  ),
});

function applyTheme(theme: ThemePref) {
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", dark);
  localStorage.setItem("creaverse:theme", theme);
}

function SettingsPage() {
  const { profile, signOut, refreshProfile } = useAuth();
  const confirm = useConfirm();
  const deleteAccount = useServerFn(deleteCurrentAccount);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [theme, setTheme] = useState<ThemePref>("system");
  const [language, setLanguage] = useState<LangPref>("en");
  const [prefs, setPrefs] = useState({ assignment: true, submission: true, grade: true });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [saving, setSaving] = useState(false);


  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setPhone(profile.phone ?? "");
    const rawProfile = profile as typeof profile & {
      theme_preference?: ThemePref;
      preferred_language?: LangPref;
      notification_preferences?: Partial<typeof prefs> | null;
    };
    setTheme(rawProfile.theme_preference ?? (localStorage.getItem("creaverse:theme") as ThemePref | null) ?? "system");
    setLanguage(rawProfile.preferred_language ?? "en");
    setPrefs({ assignment: true, submission: true, grade: true, ...(rawProfile.notification_preferences ?? {}) });
  }, [profile]);

  const home = useMemo(() => {
    if (!profile) return "/";
    return profile.role === "teacher" ? "/teacher/dashboard" : profile.role === "admin" ? "/admin/dashboard" : "/student/dashboard";
  }, [profile]);

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        theme_preference: theme,
        preferred_language: language,
        notification_preferences: prefs,
      } as never)
      .eq("id", profile.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    applyTheme(theme);
    toast.success("Settings saved");
    await refreshProfile();
  };

  const changePassword = async () => {
    if (!profile?.email) return toast.error("No account email on file.");
    if (!currentPassword) return toast.error("Enter your current password.");
    if (newPassword.length < 6) return toast.error("New password must be at least 6 characters.");
    if (newPassword !== confirmPassword) return toast.error("New password and confirmation do not match.");
    if (newPassword === currentPassword) return toast.error("New password must be different from the current one.");
    setChangingPw(true);
    // Verify the current password by attempting a fresh sign-in.
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });
    if (verifyErr) {
      setChangingPw(false);
      return toast.error("Current password is incorrect.");
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPw(false);
    if (error) return toast.error(error.message);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password changed");
  };


  const deactivate = async () => {
    const ok = await confirm({
      title: "Deactivate account?",
      description: "Your access will be paused until an admin restores it.",
      confirmText: "Deactivate",
      destructive: true,
    });
    if (!ok) return;
    const { data, error } = await supabase.rpc("user_deactivate_account");
    const result = data as { success?: boolean; error?: string } | null;
    if (error || !result?.success) return toast.error(error?.message ?? result?.error ?? "Could not deactivate account");
    toast.success("Account deactivated");
    await signOut();
  };

  const removePermanently = async () => {
    const ok = await confirm({
      title: "Permanently delete account?",
      description: "This removes your profile, classes, submissions, messages, journal entries, and sign-in account. This cannot be undone.",
      confirmText: "Delete forever",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteAccount({ data: undefined });
      toast.success("Account deleted");
      await signOut();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete account");
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="Settings" role={profile.role} email={profile.email} onSignOut={signOut} />
      <div className="mx-auto max-w-4xl px-6 py-6"><BackButton to={home} /></div>
      <main className="mx-auto max-w-4xl px-6 pb-16">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">Settings</h1>
          <p className="mt-2 text-muted-foreground">Grouped into general app preferences and account & security controls.</p>
        </div>

        <div className="grid gap-8">
          <div>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">General App Settings</h2>
            <p className="mb-4 text-sm text-muted-foreground">Appearance, language, and notification preferences for the whole app.</p>
            <div className="grid gap-5">
              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2"><Moon className="h-4 w-4 text-muted-foreground" /><h3 className="font-display text-xl text-foreground">Appearance</h3></div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {(["system", "light", "dark"] as ThemePref[]).map((t) => (
                    <button key={t} type="button" onClick={() => { setTheme(t); applyTheme(t); }} className={`press rounded-full border px-4 py-2 text-sm capitalize transition ${theme === t ? "border-[var(--color-ember)] bg-[var(--color-ember)]/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>{t}</button>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2"><Languages className="h-4 w-4 text-muted-foreground" /><h3 className="font-display text-xl text-foreground">Language</h3></div>
                <div className="inline-flex rounded-full border border-border bg-background p-1">
                  <button type="button" onClick={() => setLanguage("en")} className={`rounded-full px-5 py-2 text-sm ${language === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>English</button>
                  <button type="button" onClick={() => setLanguage("ur")} className={`rounded-full px-5 py-2 text-sm ${language === "ur" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>اردو</button>
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2"><Bell className="h-4 w-4 text-muted-foreground" /><h3 className="font-display text-xl text-foreground">Notifications</h3></div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    ["assignment", "New assignments"],
                    ["submission", "Student submissions"],
                    ["grade", "Grades & feedback"],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm">
                      <span>{label}</span>
                      <input type="checkbox" checked={prefs[key as keyof typeof prefs]} onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })} />
                    </label>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Account Settings</h2>
            <p className="mb-4 text-sm text-muted-foreground">Your profile, sign-in security, and account lifecycle.</p>
            <div className="grid gap-5">
              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2"><UserCog className="h-4 w-4 text-muted-foreground" /><h3 className="font-display text-xl text-foreground">Profile</h3></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2"><KeyRound className="h-4 w-4 text-muted-foreground" /><h3 className="font-display text-xl text-foreground">Change password</h3></div>
                <p className="mb-3 text-xs text-muted-foreground">Enter your current password to authorize the change, then set a new one.</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <input type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  <input type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div className="mt-3">
                  <button type="button" onClick={changePassword} disabled={changingPw} className="press rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">{changingPw ? "Updating…" : "Update password"}</button>
                </div>
              </section>

              <section className="rounded-2xl border border-destructive/30 bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-destructive" /><h3 className="font-display text-xl text-foreground">Danger zone</h3></div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={deactivate} className="press inline-flex items-center gap-2 rounded-full border border-destructive/40 px-5 py-2 text-sm font-medium text-destructive"><ShieldAlert className="h-4 w-4" /> Deactivate account</button>
                  <button type="button" onClick={removePermanently} className="press inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-2 text-sm font-medium text-destructive-foreground"><Trash2 className="h-4 w-4" /> Delete forever</button>
                </div>
              </section>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={saveProfile} disabled={saving} className="press rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">{saving ? "Saving…" : "Save settings"}</button>
            <Link to={home} className="press rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground">Back to dashboard</Link>
          </div>
        </div>

      </main>
    </div>
  );
}