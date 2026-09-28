import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { BookLogo } from "@/components/BookLogo";
import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/hooks/useAuth";
import { brand } from "@/lib/brand";
import { normalizeUsername, placeholderEmailFor, resolveIdentifier } from "@/lib/identity";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign In or Sign Up — CreaVerse" },
      { name: "description", content: "Sign in or create a CreaVerse account with just a username and password to access classes, AI mentorship, and opportunities." },
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

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [fullName, setFullName] = useState("");
  const [school, setSchool] = useState("");
  const [gender, setGender] = useState("");

  useEffect(() => {
    if (profile) {
      navigate({ to: roleHome[profile.role] });
    } else if (user && !authLoading) {
      navigate({ to: roleHome.student });
    }
  }, [authLoading, user, profile, navigate]);

  const handleEmail = async () => {
    if (isSignup) {
      if (identifier.includes("@")) throw new Error("Usernames can't contain \"@\"");
      const username = normalizeUsername(identifier);
      if (username.length < 3) throw new Error("Username must be at least 3 characters (letters, numbers, . _ -)");
      const name = fullName.trim();
      if (!name) throw new Error("Please enter your full name");
      const { data, error } = await supabase.auth.signUp({
        email: placeholderEmailFor(username),
        password,
        options: { data: { full_name: name } },
      });
      if (error) {
        if (/already|registered|exists/i.test(error.message)) {
          throw new Error(`The username "${username}" is already taken — try another.`);
        }
        throw error;
      }
      const uid = data.user?.id;
      if (!uid || !data.session) {
        // Duplicate sign-ups can return a user with no session.
        throw new Error(`The username "${username}" is already taken — try another.`);
      }
      await supabase
        .from("profiles")
        .update({ username, full_name: name, school: school.trim() || null, gender: gender || null })
        .eq("id", uid);
      toast.success(`Welcome to ${brand.name}!`);
    } else {
      const { email } = resolveIdentifier(identifier);
      if (!email) throw new Error("Enter your username");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error("Wrong username or password");
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
              ? `Just a username and password — no email needed.`
              : "Sign in to continue your learning journey."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <Field label="Username">
            <input
              type="text"
              required
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              maxLength={120}
              className={inputCls}
              placeholder="yourname"
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
          </Field>

          {isSignup && (
            <>
              <Field label="Full name">
                <input required maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} placeholder="Your full name" />
              </Field>
              <Field label="School (optional)">
                <input maxLength={150} value={school} onChange={(e) => setSchool(e.target.value)} className={inputCls} placeholder="School, college or academy" />
              </Field>
              <Field label="Gender (optional)">
                <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputCls}>
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>
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
