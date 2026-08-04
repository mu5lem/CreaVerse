import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";
import { contests, type Contest } from "@/lib/contests-data";
import { Search, ExternalLink, Trophy } from "lucide-react";

export const Route = createFileRoute("/contests")({
  head: () => ({
    meta: [
      { title: "Contests & Competitions — Olympiads, Hackathons | CreaVerse" },
      { name: "description", content: "Discover 40+ real contests for students: IMO, IOI, ICPC, NSTC, robotics, MUN, hackathons, and more — Pakistan and global." },
      { property: "og:title", content: "Contests & Competitions — CreaVerse" },
      { property: "og:description", content: "A directory of extracurricular contests for Pakistani and international students." },
      { property: "og:url", content: "/contests" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/contests" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Contests & Competitions",
        description: "Extracurricular contests and competitions for students.",
        url: "https://spark-creaverse.lovable.app/contests",
      }),
    }],
  }),
  component: () => (
    <ProtectedRoute>
      <ContestsPage />
    </ProtectedRoute>
  ),
});

const categories: (Contest["category"] | "all")[] = [
  "all",
  "Olympiad",
  "Programming",
  "Robotics",
  "Science Fair",
  "Debate/MUN",
  "Hackathon",
  "Writing/Arts",
  "Business",
];

function ContestsPage() {
  const { profile, signOut } = useAuth();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"all" | "Pakistan" | "Global">("all");
  const [category, setCategory] = useState<Contest["category"] | "all">("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return contests.filter((c) => {
      if (scope !== "all" && c.scope !== scope) return false;
      if (category !== "all" && c.category !== category) return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    });
  }, [query, scope, category]);

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="Contests" role={profile.role} email={profile.email} onSignOut={signOut} />
      <div className="mx-auto max-w-6xl px-6 py-6">
        <BackButton />
      </div>
      <main className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">Competitions & contests</h1>
          <p className="mt-2 text-muted-foreground">Olympiads, hackathons, debates, robotics and more — Pakistan-friendly and global opportunities to stand out.</p>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contests…"
              className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm"
            />
          </div>
          <select value={scope} onChange={(e) => setScope(e.target.value as typeof scope)} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
            <option value="all">All scopes</option>
            <option value="Pakistan">Pakistan</option>
            <option value="Global">Global</option>
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
            {categories.map((c) => (
              <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">No contests match your filters.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 stagger-children">
            {filtered.map((c) => (
              <a
                key={c.id}
                href={c.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-[var(--color-ember)]/60"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-ember)]/15 px-2.5 py-0.5 text-xs font-medium text-[var(--color-ember)]">
                    <Trophy className="h-3 w-3" /> {c.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{c.scope}</span>
                </div>
                <h2 className="mt-2 font-display text-lg text-foreground">{c.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
                <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-ember)] opacity-0 transition group-hover:opacity-100">
                  Learn more <ExternalLink className="h-3 w-3" />
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
