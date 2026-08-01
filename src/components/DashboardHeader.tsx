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
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <BookLogo size={36} className="text-[var(--color-ink)]" />
          <div>
            <div className="font-display text-xl leading-tight text-foreground">
              {title}
            </div>
            <p className="text-xs font-medium italic tracking-wide text-muted-foreground">
              {brand.tagline}
            </p>

          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="text-sm text-foreground">{email}</div>
            <div className="text-xs uppercase tracking-wider text-[var(--color-ember)]">
              {role}
            </div>
          </div>
          <NotificationsBell />
          <Link
            to="/settings"
            className="press inline-flex rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary sm:px-4"
          >
            Settings
          </Link>
          <FeedbackButton />
          <button
            onClick={onSignOut}
            className="press rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
