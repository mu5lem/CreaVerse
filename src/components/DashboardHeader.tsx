import { brand } from "@/lib/brand";
import { BookLogo } from "./BookLogo";
import { FeedbackButton } from "./FeedbackButton";
import { NotificationsBell } from "./NotificationsBell";
import { Link } from "@tanstack/react-router";

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
          <button
            onClick={onSignOut}
            className="press rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary sm:px-4"
          >
            <span className="sm:hidden">Exit</span>
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}

