import { BookLogo } from "./BookLogo";

export function BrandedLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-[var(--color-ember)]/20" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-parchment)] shadow-sm">
            <BookLogo size={44} className="animate-pulse text-[var(--color-ink)]" />
          </div>
        </div>
        <div className="text-center">
          <div className="font-display text-2xl tracking-tight text-foreground">
            CreaVerse
          </div>
          <div className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}
