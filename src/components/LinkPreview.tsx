import { ExternalLink, Link2 } from "lucide-react";

function safeUrl(raw: string): URL | null {
  try {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(withProto);
  } catch {
    return null;
  }
}

export function LinkPreview({ url, title }: { url: string; title?: string | null }) {
  const parsed = safeUrl(url);
  if (!parsed) return null;
  const host = parsed.hostname.replace(/^www\./, "");
  const pathLabel = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : "";
  const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
  return (
    <a
      href={parsed.toString()}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-3 rounded-xl border border-border bg-background p-3 shadow-sm transition hover:border-[var(--color-ember)]/60"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--color-parchment)]">
        <img
          src={favicon}
          alt=""
          width={24}
          height={24}
          className="h-6 w-6"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
            const sib = (e.currentTarget.nextElementSibling as HTMLElement | null);
            if (sib) sib.style.display = "block";
          }}
        />
        <Link2 className="hidden h-5 w-5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{title || host}</div>
        <div className="truncate text-xs text-muted-foreground">
          {host}
          {pathLabel && <span className="opacity-70">{pathLabel}</span>}
        </div>
      </div>
      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-[var(--color-ember)]" />
    </a>
  );
}
