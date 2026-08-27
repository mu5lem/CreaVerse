import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { BookLogo } from "@/components/BookLogo";
import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/hooks/useAuth";
import { brand } from "@/lib/brand";
import { resolveIdentifier } from "@/lib/identity";
import { Info } from "lucide-react";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign In or Sign Up — CreaVerse" },
      { name: "description", content: "Sign in or create a CreaVerse account with an email or username to access classes, AI mentorship, and opportunities." },
      { property: "og:title", content: "Sign In — CreaVerse" },
      { property: "og:description", content: "Access your CreaVerse learning account." },
      { property: "og:url", content: "/auth" },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/auth" }],
  }),
  component: AuthPage,
});

const roleHome = {
  student: "/student/dashboard",
  teacher: "/teacher/dashboard",
  admin: "/admin/dashboard",
} as const;

function AuthPage() {
  const { mode = "signin" } = Route.useSearch();
  const isSignup = mode === "signup";
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();

  const [googleLoading, setGoogleLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [school, setSchool] = useState("");
  const [gender, setGender] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSending, setForgotSending] = useState(false);

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || forgotSending) return;
    setForgotSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotSending(false);
    if (error) return toast.error(error.message);
    toast.success("Password reset email sent — check your inbox.");
    setForgotOpen(false);
    setForgotEmail("");
  };

  useEffect(() => {
    if (profile) {
      navigate({ to: roleHome[profile.role] });
    } else if (user && !authLoading) {
      navigate({ to: roleHome.student });
    }
  }, [authLoading, user, profile, navigate]);

  const handleGoogle = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
      // Supabase redirects the browser away for OAuth; nothing else to do here.
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmail = async () => {
    const { email, username } = resolveIdentifier(identifier);
    if (!email || (username !== null && username.length < 3)) {
      throw new Error("Enter an email or a username of at least 3 characters");
    }

    if (isSignup) {
      if (!fullName.trim()) throw new Error("Please enter your full name");
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      const uid = data.user?.id;
      if (uid && data.session) {
        await supabase
          .from("profiles")
          .update({
            username: username ?? null,
            email_verified: false,
            full_name: fullName.trim(),
            school: school.trim() || null,
            gender: gender || null,
          })
          .eq("id", uid);
      }
      if (!data.session) {
        // Should not happen with instant sign-up, but stay graceful.
        toast.success("Account created — please sign in.");
        return;
      }
      toast.success(`Welcome to ${brand.name}!`);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back!");
    }
    await refreshProfile();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (isSignup && !agreed) {
      toast.error("Please agree to the Privacy Policy and Terms of Service to continue.");
      return;
    }
    setSubmitting(true);
    try {
      await handleEmail();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <Link to="/" className="flex items-center gap-3">
          <BookLogo size={32} className="text-[var(--color-ink)]" />
          <span className="font-display text-xl font-semibold text-foreground">{brand.name}</span>
        </Link>
        <Link
          to="/"
          className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
        >
          Back home
        </Link>
      </div>

      <div className="mx-auto flex max-w-md flex-col items-stretch px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignup
              ? `Two fields and you're in. Explore ${brand.name} right away.`
              : "Sign in to continue your learning journey."}
          </p>
        </div>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading}
          className="press mb-3 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition hover:bg-secondary disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C33.9 6.1 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.9 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C33.9 6.1 29.2 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.1 0 9.8-2 13.3-5.2l-6.1-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.4 39.6 16.1 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.7l6.1 5.2c-.4.4 6.7-4.9 6.7-14.9 0-1.3-.1-2.4-.4-3.5z"/>
          </svg>
          {googleLoading ? "Opening Google…" : "Continue with Google"}
        </button>

        <div className="mb-3 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <Field label="Email or username">
            <input
              type="text"
              required
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              maxLength={120}
              className={inputCls}
              placeholder="you@example.com or yourname"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              minLength={6}
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              placeholder="••••••••"
            />
            {!isSignup && (
              <button
                type="button"
                onClick={() => { setForgotEmail(identifier.includes("@") ? identifier : ""); setForgotOpen(true); }}
                className="mt-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Forgot password?
              </button>
            )}
          </Field>

          {isSignup && (
            <>
              <Field label="Full name">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  maxLength={120}
                  className={inputCls}
                  placeholder="Your full name"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="School / College (optional)">
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    maxLength={200}
                    className={inputCls}
                    placeholder="e.g. Daanish School DG Khan"
                  />
                </Field>
                <Field label="Gender (optional)">
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
              </div>
            </>
          )}

          {isSignup && (
            <label className="flex items-start gap-2 rounded-lg border border-border bg-[var(--color-parchment)]/40 p-3 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input"
              />
              <span>
                I agree to the{" "}
                <Link to="/privacy" className="font-medium text-foreground underline underline-offset-2">Privacy Policy</Link>{" "}
                and{" "}
                <Link to="/terms" className="font-medium text-foreground underline underline-offset-2">Terms of Service</Link>.
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={submitting || (isSignup && !agreed)}
            className="w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Working…" : isSignup ? "Create account" : "Sign in"}
          </button>
        </form>

        {isSignup && (
          <div className="mt-4 flex gap-3 rounded-2xl border border-border bg-[var(--color-parchment)]/50 p-4 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-ember)]" />
            <div>
              You can sign up with any email — even a temporary one — to get started right away.
              You'll only need to verify a real email when you're ready to join a class as a
              student or become a teacher.
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <Link to="/auth" search={{ mode: "signin" }} className="font-medium text-foreground underline-offset-4 hover:underline">
                Sign in
              </Link>
            </>
          ) : (
            <>
              New here?{" "}
              <Link to="/auth" search={{ mode: "signup" }} className="font-medium text-foreground underline-offset-4 hover:underline">
                Create an account
              </Link>
            </>
          )}
        </div>
      </div>

      {forgotOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setForgotOpen(false)}
        >
          <form
            onSubmit={handleForgot}
            onClick={(e) => e.stopPropagation()}
            className="animate-pop-in w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
          >
            <h3 className="font-display text-xl text-foreground">Reset your password</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your account email and we'll send you a reset link.
            </p>
            <input
              type="email"
              required
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="you@example.com"
              className={`mt-4 ${inputCls}`}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="press rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={forgotSending}
                className="press rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {forgotSending ? "Sending…" : "Send reset link"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-[var(--color-ember)] focus:ring-2 focus:ring-[var(--color-ember)]/20 disabled:opacity-60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
