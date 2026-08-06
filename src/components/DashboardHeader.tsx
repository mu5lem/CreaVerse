import { brand } from "@/lib/brand";
import { BookLogo } from "./BookLogo";
import { FeedbackButton } from "./FeedbackButton";
import { NotificationsBell } from "./NotificationsBell";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, ArrowLeft } from "lucide-react";

function homeFor(role: string) {
  if (role === "teacher") return "/teacher/dashboard";
  if (role === "admin") return "/admin/dashboard";
  return "/student/dashboard";
}

export function DashboardHeader({
  title,
  role,
  email,
  onSignOut,
}: {
  title: string;
  role: string;
  email: string;
  onSignOut: () => void;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const home = homeFor(role);
  // On the user's home dashboard the action is "Sign out".
  // Anywhere deeper (a feature or section) it becomes "Exit" back to home.
  const atHome = pathname === home || pathname === `${home}/`;

  return (
    <header className="border-b border-border bg-[var(--color-parchment)]">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:flex sm:justify-between sm:px-6 sm:py-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <BookLogo size={32} className="shrink-0 text-[var(--color-ink)] sm:h-9 sm:w-9" />
          <div className="min-w-0">
            <div className="truncate font-display text-lg leading-tight text-foreground sm:text-xl">
              {title}
            </div>
            <p className="truncate text-[11px] font-medium italic tracking-wide text-muted-foreground sm:text-xs">
              {brand.tagline}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <div className="hidden text-right md:block">
            <div className="max-w-[180px] truncate text-sm text-foreground">{email}</div>
            <div className="text-xs uppercase tracking-wider text-[var(--color-ember)]">
              {role}
            </div>
          </div>
          <NotificationsBell />
          <Link
            to="/settings"
            aria-label="Settings"
            className="press inline-flex rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary sm:px-4"
          >
            Settings
          </Link>
          <FeedbackButton />
          {atHome ? (
            <button
              onClick={onSignOut}
              aria-label="Sign out"
              className="press inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary sm:px-4"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          ) : (
            <button
              onClick={() => navigate({ to: home })}
              aria-label="Exit to dashboard"
              className="press inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary sm:px-4"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
}

