import { useEffect, useMemo, useState } from "react";
import { BookOpen, X } from "lucide-react";
import type { AcademyCategory } from "@/lib/academy-data";
import { flattenAcademy } from "@/lib/academy-utils";

/** Inline picker that lets a teacher choose an Academy resource to attach to an assignment. */
export function AcademyPicker({ onPick }: { onPick: (url: string) => void }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<AcademyCategory[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open || data) return;
    import("@/lib/academy-data").then((m) => setData(m.academyData));
  }, [open, data]);

  const results = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    const all = flattenAcademy(data);
    const list = needle
      ? all.filter((m) => `${m.title} ${m.description} ${m.source}`.toLowerCase().includes(needle))
      : all;
    return list.slice(0, 30);
  }, [data, q]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg border border-input px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <BookOpen className="h-4 w-4" /> Pick from Academy
      </button>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-2">
        <input
          autoFocus
          aria-label="Search Academy resources"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Academy…"
          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close Academy picker"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
        {!data && <li className="p-2 text-sm text-muted-foreground">Loading…</li>}
        {data && results.length === 0 && (
          <li className="p-2 text-sm text-muted-foreground">No matches.</li>
        )}
        {results.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => {
                onPick(m.url);
                setOpen(false);
                setQ("");
              }}
              className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-secondary"
            >
              <span className="font-medium text-foreground">{m.title}</span>
              <span className="ml-2 text-xs text-muted-foreground">{m.source}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
