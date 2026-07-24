import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BookLogo } from "@/components/BookLogo";
import { brand } from "@/lib/brand";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — CreaVerse" },
      { name: "description", content: "Set a new password for your CreaVerse account." },
      { property: "og:title", content: "Reset Password — CreaVerse" },
      { property: "og:description", content: "Set a new password for your CreaVerse account." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase places the recovery session on the URL hash; the client picks
    // it up automatically on load. Just wait a beat and confirm.
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords don't match");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated — you're signed in.");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="mb-8 flex items-center gap-3">
          <BookLogo size={32} className="text-[var(--color-ink)]" />
          <span className="font-display text-xl font-semibold text-foreground">{brand.name}</span>
        </div>
        <h1 className="font-display text-3xl font-semibold text-foreground">Set a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a strong password you haven't used before.
        </p>
        {!ready && (
          <div className="mt-6 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            Waiting for reset session… if this stays here, the link may have expired — request a new one.
          </div>
        )}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm"
          />
          <input
            type="password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm password"
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={saving || !ready}
            className="press w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}