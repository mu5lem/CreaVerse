import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { GraduationCap, MailCheck, ShieldCheck, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isPlaceholderEmail, looksLikeEmail } from "@/lib/identity";

export type VerifyIntent = "student" | "teacher";

const PENDING_KEY = "creaverse:pending-verification";

/** Remember the intent across the Google OAuth full-page redirect. */
export function readPendingVerification(): VerifyIntent | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(PENDING_KEY);
  return v === "student" || v === "teacher" ? v : null;
}
export function clearPendingVerification() {
  if (typeof window !== "undefined") window.localStorage.removeItem(PENDING_KEY);
}

const inputCls =
  "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-[var(--color-ember)] focus:ring-2 focus:ring-[var(--color-ember)]/20 disabled:opacity-60";
const primaryBtn =
  "press w-full rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60";
const ghostBtn =
  "press w-full rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary disabled:opacity-60";

type Step = "choose" | "email" | "code" | "intent";

export function VerificationGate({
  intent,
  open,
  onClose,
  /** Skip verification UI and jump straight to the intent step (already verified). */
  startVerified = false,
}: {
  intent: VerifyIntent;
  open: boolean;
  onClose: () => void;
  startVerified?: boolean;
}) {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(startVerified ? "intent" : "choose");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  // Intent-step state
  const [classCode, setClassCode] = useState("");
  const [school, setSchool] = useState("");
  const [teacherCode, setTeacherCode] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep(startVerified || profile?.email_verified ? "intent" : "choose");
    const current = profile?.email ?? user?.email ?? "";
    setEmail(!isPlaceholderEmail(current) && looksLikeEmail(current) ? current : "");
  }, [open, startVerified, profile?.email_verified, profile?.email, user?.email]);

  if (!open) return null;

  const markVerified = async (verifiedEmail: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ email: verifiedEmail, email_verified: true })
      .eq("id", user.id);
    if (error) throw error;
    await refreshProfile();
  };

  const handleGoogle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      window.localStorage.setItem(PENDING_KEY, intent);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err) {
      clearPendingVerification();
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setBusy(false);
    }
  };

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const target = email.trim().toLowerCase();
    if (!looksLikeEmail(target)) return toast.error("Enter a valid email address");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: target });
      if (error) throw error;
      toast.success("Verification code sent — check your inbox.");
      setStep("code");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the code");
    } finally {
      setBusy(false);
    }
  };

  const confirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const target = email.trim().toLowerCase();
    const token = code.trim();
    if (!token) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: target,
        token,
        type: "email_change",
      });
      if (error) throw error;
      await markVerified(target);
      toast.success("Email verified!");
      setStep("intent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "That code didn't work");
    } finally {
      setBusy(false);
    }
  };

  const joinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const codeVal = classCode.trim().toUpperCase();
    if (!codeVal) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("join_class", { _code: codeVal });
      if (error) throw error;
      const result = data as { success: boolean; error?: string } | null;
      if (!result?.success) throw new Error(result?.error ?? "Could not join that class");
      toast.success("Enrolled!");
      onClose();
      navigate({ to: "/student/class/$classCode", params: { classCode: codeVal } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not join that class");
    } finally {
      setBusy(false);
    }
  };

  const redeemTeacherCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !teacherCode.trim()) return;
    setBusy(true);
    try {
      if (school.trim() && user) {
        await supabase.from("profiles").update({ school: school.trim() }).eq("id", user.id);
      }
      const { data, error } = await supabase.rpc("request_role_upgrade", {
        requested_role: "teacher",
        invite_code: teacherCode.trim(),
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error ?? "Invite code was rejected");
      toast.success("You're now a teacher — welcome!");
      await refreshProfile();
      onClose();
      navigate({ to: "/teacher/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const requestFromAdmin = async () => {
    if (busy || !user) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("teacher_requests").insert({
        user_id: user.id,
        school_name: school.trim() || null,
      });
      if (error) throw error;
      if (school.trim()) {
        await supabase.from("profiles").update({ school: school.trim() }).eq("id", user.id);
      }
      toast.success("Request sent — an admin will review it shortly.");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the request");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="animate-pop-in relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-muted-foreground transition hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        {step === "choose" && (
          <>
            <Header
              icon={<ShieldCheck className="h-5 w-5 text-[var(--color-ember)]" />}
              title="Verify your email"
              subtitle={
                intent === "student"
                  ? "Joining a class needs a real email so your teacher can reach you."
                  : "Becoming a teacher needs a verified, real email address."
              }
            />
            <button type="button" onClick={handleGoogle} disabled={busy} className={`${ghostBtn} mt-5`}>
              Continue with Google
            </button>
            <div className="my-3 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>
            <button type="button" onClick={() => setStep("email")} className={primaryBtn}>
              Verify with an email
            </button>
          </>
        )}

        {step === "email" && (
          <form onSubmit={sendCode}>
            <Header
              icon={<MailCheck className="h-5 w-5 text-[var(--color-ember)]" />}
              title="Enter a real email"
              subtitle="We'll send a verification code to this address."
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`mt-5 ${inputCls}`}
            />
            <button type="submit" disabled={busy} className={`${primaryBtn} mt-3`}>
              {busy ? "Sending…" : "Send code"}
            </button>
            <button type="button" onClick={() => setStep("choose")} className={`${ghostBtn} mt-2`}>
              Back
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={confirmCode}>
            <Header
              icon={<MailCheck className="h-5 w-5 text-[var(--color-ember)]" />}
              title="Enter the code"
              subtitle={`We sent a verification code to ${email}.`}
            />
            <input
              inputMode="numeric"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className={`mt-5 ${inputCls} tracking-[0.3em]`}
            />
            <button type="submit" disabled={busy} className={`${primaryBtn} mt-3`}>
              {busy ? "Verifying…" : "Verify"}
            </button>
            <button type="button" onClick={() => setStep("email")} className={`${ghostBtn} mt-2`}>
              Use a different email
            </button>
          </form>
        )}

        {step === "intent" && intent === "student" && (
          <form onSubmit={joinClass}>
            <Header
              icon={<GraduationCap className="h-5 w-5 text-[var(--color-ember)]" />}
              title="Join your class"
              subtitle="Enter the class code your teacher gave you."
            />
            <input
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              placeholder="Class code"
              className={`mt-5 ${inputCls} uppercase`}
            />
            <button type="submit" disabled={busy || !classCode.trim()} className={`${primaryBtn} mt-3`}>
              {busy ? "Joining…" : "Join class"}
            </button>
          </form>
        )}

        {step === "intent" && intent === "teacher" && (
          <div>
            <Header
              icon={<GraduationCap className="h-5 w-5 text-[var(--color-ember)]" />}
              title="I'm a teacher"
              subtitle="Tell us where you teach, then redeem a code or ask an admin for one."
            />
            <input
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="School name (optional)"
              className={`mt-5 ${inputCls}`}
            />
            <form onSubmit={redeemTeacherCode} className="mt-4 space-y-2">
              <input
                value={teacherCode}
                onChange={(e) => setTeacherCode(e.target.value)}
                placeholder="Teacher code"
                className={inputCls}
              />
              <button type="submit" disabled={busy || !teacherCode.trim()} className={primaryBtn}>
                {busy ? "Working…" : "I have a teacher code"}
              </button>
            </form>
            <div className="my-3 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>
            <button type="button" onClick={requestFromAdmin} disabled={busy} className={ghostBtn}>
              Request a code from admin
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Header({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 pr-6">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--color-ember)]/10">
        {icon}
      </span>
      <div className="min-w-0">
        <h3 className="font-display text-xl text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
