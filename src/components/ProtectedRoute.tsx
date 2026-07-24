import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, type Role } from "@/hooks/useAuth";
import { BrandedLoader } from "./BrandedLoader";

const roleHome: Record<Role, string> = {
  student: "/student/dashboard",
  teacher: "/teacher/dashboard",
  admin: "/admin/dashboard",
};

export function ProtectedRoute({
  role,
  children,
}: {
  role?: Role;
  children: ReactNode;
}) {
  const { user, profile, loading, error, retry, signOut } = useAuth();
  const navigate = useNavigate();

  // Redirects (never auto-sign-out suspended users — they see a clear screen instead)
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (role && profile && !profile.is_suspended && profile.role !== role) {
      navigate({ to: roleHome[profile.role] });
    }
  }, [loading, user, profile, role, navigate]);

  if (loading) return <BrandedLoader />;

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <h2 className="font-display text-2xl text-foreground">
            Something went wrong loading your account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <button
            onClick={retry}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (profile?.is_suspended) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-2xl border border-destructive/30 bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          </div>
          <h2 className="mt-4 font-display text-2xl text-foreground">Account Suspended</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your access has been paused by an administrator. Please contact support if
            you believe this is a mistake.
          </p>
          <button
            onClick={() => signOut()}
            className="mt-6 inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            Return home
          </button>
        </div>
      </div>
    );
  }

  if (!user || !profile || (role && profile.role !== role)) {
    return <BrandedLoader />;
  }

  return <>{children}</>;
}
