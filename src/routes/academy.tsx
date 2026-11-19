import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { brand } from "@/lib/brand";
import type { AcademyCategory, AcademyLevel } from "@/lib/academy-data";
import { mentorPromptFor, mentorSubjectFor } from "@/lib/academy-utils";
import {
  ChevronDown,
  BookOpen,
  ExternalLink,
  Check,
  Search,
  Sparkles,
  PlayCircle,
} from "lucide-react";

export const Route = createFileRoute("/academy")({
  head: () => ({
    meta: [
      { title: "Academy — Free Learning Pathways | CreaVerse" },
      {
        name: "description",
        content:
          "Free learning pathways for Pakistani and global students — Matric, FSc, MDCAT, ECAT, CSS/PMS, university courses and career skills.",
      },
      { property: "og:title", content: "Academy — CreaVerse" },
      {
        property: "og:description",
        content:
          "Curated free courses and pathways for Pakistani learners, from board exams to competitive tests.",
      },
      { property: "og:url", content: `${brand.siteUrl}/academy` },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `${brand.siteUrl}/academy` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "CreaVerse Academy",
          description: "Free learning pathways for students.",
          url: `${brand.siteUrl}/academy`,
        }),
      },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <AcademyPage />
    </ProtectedRoute>
  ),
});

interface ProgressRow {
  resource_id: string;
  status: string;
  updated_at: string;
}

type LevelFilter = AcademyLevel | "all";

function AcademyPage() {
  const { profile, signOut, user } = useAuth();
  const [categories, setCategories] = useState<AcademyCategory[] | null>(null);
  const [labels, setLabels] = useState<Record<AcademyLevel, string> | null>(null);
  const [progress, setProgress] = useState<Record<string, ProgressRow>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<LevelFilter>("all");

  // Lazy-load the (large) data module so it stays out of the main bundle.
  useEffect(() => {
    let cancelled = false;
    import("@/lib/academy-data").then((m) => {
      if (cancelled) return;
      // Pakistan-context pathways first (stable sort keeps the authored order inside each group).
      setCategories([...m.academyData].sort((a, b) => Number(b.pk) - Number(a.pk)));
      setLabels(m.LEVEL_LABELS);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setQuery(draft.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [draft]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase
      .from("academy_progress")
      .select("resource_id, status, updated_at")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("load academy progress", error);
          return;
        }
        const map: Record<string, ProgressRow> = {};
        (data ?? []).forEach((r) => {
          map[r.resource_id] = r;
        });
        setProgress(map);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggleDone = useCallback(
    async (resourceId: string) => {
      if (!user) return;
      const wasDone = progress[resourceId]?.status === "done";
      const previous = progress;
      // Optimistic update; rolled back if the save fails.
      if (wasDone) {
        const next = { ...progress };
        delete next[resourceId];
        setProgress(next);
      } else {
        setProgress({
          ...progress,
          [resourceId]: {
            resource_id: resourceId,
            status: "done",
            updated_at: new Date().toISOString(),
          },
        });
      }
      const { error } = wasDone
        ? await supabase
            .from("academy_progress")
            .delete()
            .eq("user_id", user.id)
            .eq("resource_id", resourceId)
        : await supabase.from("academy_progress").upsert(
            {
              user_id: user.id,
              resource_id: resourceId,
              status: "done",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,resource_id" },
          );
      if (error) {
        setProgress(previous);
        toast.error("Could not save your progress. Please try again.");
      }
    },
    [user, progress],
  );

  const visible = useMemo(() => {
    if (!categories) return [];
    return categories
      .filter((c) => level === "all" || c.levels.includes(level))
      .map((c) => {
        if (!query) return { cat: c, modules: c.modules };
        const catMatch = c.title.toLowerCase().includes(query);
        return {
          cat: c,
          modules: c.modules.filter(
            (m) =>
              catMatch || `${m.title} ${m.description} ${m.source}`.toLowerCase().includes(query),
          ),
        };
      })
      .filter((x) => x.modules.length > 0);
  }, [categories, level, query]);

  const resumeTarget = useMemo(() => {
    if (!categories) return null;
    const done = Object.values(progress)
      .filter((p) => p.status === "done")
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    if (done.length === 0) return null;
    const last = done[0].resource_id;
    const cat = categories.find((c) => c.modules.some((m) => m.id === last));
    if (!cat) return null;
    const next =
      cat.modules.find((m) => progress[m.id]?.status !== "done") ??
      categories.flatMap((c) => c.modules).find((m) => progress[m.id]?.status !== "done");
    return next
      ? { module: next, category: categories.find((c) => c.modules.includes(next)) ?? cat }
      : null;
  }, [categories, progress]);

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        title="Academy"
        role={profile.role}
        email={profile.email}
        onSignOut={signOut}
      />
      <div className="mx-auto max-w-5xl px-6 py-6">
        <BackButton />
      </div>
      <main className="mx-auto max-w-5xl px-6 pb-16">
        <div className="mb-6">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
            Academy
          </h1>
          <p className="mt-2 text-muted-foreground">
            Free, curated pathways — Pakistani curriculum first, then world-class free universities
            and career skills. Mark resources done to track your progress.
          </p>
        </div>

        {resumeTarget && (
          <a
            href={resumeTarget.module.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-6 flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-[var(--color-ember)]"
          >
            <PlayCircle className="h-8 w-8 shrink-0 text-[var(--color-ember)]" />
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Continue where you left off
              </div>
              <div className="truncate font-medium text-foreground">
                {resumeTarget.module.title}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {resumeTarget.category.title}
              </div>
            </div>
          </a>
        )}

        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            aria-label="Search the Academy"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search courses, subjects, exams…"
            className="w-full rounded-lg border border-input bg-background py-3 pl-10 pr-4 text-sm"
          />
        </div>

        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by level">
          {(
            ["all", ...(labels ? (Object.keys(labels) as AcademyLevel[]) : [])] as LevelFilter[]
          ).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLevel(l)}
              aria-pressed={level === l}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                level === l
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {l === "all" ? "All" : labels?.[l]}
            </button>
          ))}
        </div>

        {!categories && <p className="py-8 text-sm text-muted-foreground">Loading pathways…</p>}
        {categories && visible.length === 0 && (
          <p className="py-8 text-sm text-muted-foreground">
            No resources match your search. Try another word or level.
          </p>
        )}

        <div className="space-y-3">
          {visible.map(({ cat, modules }) => {
            const isOpen = query ? true : (open ?? visible[0]?.cat.id) === cat.id;
            const doneCount = cat.modules.filter((m) => progress[m.id]?.status === "done").length;
            const pct = Math.round((doneCount / cat.modules.length) * 100);
            return (
              <div
                key={cat.id}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen && !query ? "" : cat.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-parchment)] text-[var(--color-ink)]">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-display text-lg text-foreground">{cat.title}</h2>
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div
                          className="h-1.5 w-28 overflow-hidden rounded-full bg-secondary"
                          role="progressbar"
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${cat.title} progress`}
                        >
                          <div
                            className="h-full rounded-full bg-[var(--color-ember)]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {doneCount}/{cat.modules.length} done
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="grid gap-3 border-t border-border bg-[var(--color-parchment)]/40 p-4 sm:grid-cols-2 sm:p-6">
                    {modules.map((m) => {
                      const done = progress[m.id]?.status === "done";
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col rounded-xl border bg-card p-4 transition ${
                            done ? "border-[var(--color-ember)]/50" : "border-border"
                          }`}
                        >
                          <a
                            href={m.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-start justify-between gap-2"
                          >
                            <h3 className="font-medium text-foreground group-hover:text-[var(--color-ember)]">
                              {m.title}
                            </h3>
                            <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-[var(--color-ember)]" />
                          </a>
                          <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                          <span className="mt-3 inline-flex w-fit items-center rounded-full bg-[var(--color-parchment)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--color-ink)]">
                            {m.source}
                          </span>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => toggleDone(m.id)}
                              aria-pressed={done}
                              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition ${
                                done
                                  ? "border-[var(--color-ember)] bg-[var(--color-ember)]/10 text-foreground"
                                  : "border-border text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <Check className="h-3 w-3" /> {done ? "Done" : "Mark done"}
                            </button>
                            <Link
                              to="/mentor"
                              search={{
                                subject: mentorSubjectFor(`${m.title} ${cat.title}`),
                                prompt: mentorPromptFor(m.title),
                              }}
                              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                            >
                              <Sparkles className="h-3 w-3" /> Ask the Mentor
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
