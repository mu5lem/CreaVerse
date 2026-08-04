import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";
import { opportunities } from "@/lib/opportunities-data";
import { Search, ExternalLink, MapPin } from "lucide-react";

export const Route = createFileRoute("/opportunities")({
  head: () => ({
    meta: [
      { title: "Opportunity Hub — Universities & Scholarships | CreaVerse" },
      { name: "description", content: "100+ universities and scholarships for Pakistani and global students — NTHP, HEC, Rhodes, Gates Cambridge, and more." },
      { property: "og:title", content: "Opportunity Hub — CreaVerse" },
      { property: "og:description", content: "Curated Pakistani and global university and scholarship opportunities." },
      { property: "og:url", content: "/opportunities" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/opportunities" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Opportunity Hub",
        description: "Universities and scholarships directory.",
        url: "https://spark-creaverse.lovable.app/opportunities",
      }),
    }],
  }),
  component: () => (
    <ProtectedRoute>
      <OpportunityHub />
    </ProtectedRoute>
  ),
});

function OpportunityHub() {
  const { profile, signOut } = useAuth();
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState<"all" | "Pakistan" | "Global">("all");
  const [type, setType] = useState<"all" | "University" | "Scholarship">("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return opportunities.filter((o) => {
      if (country !== "all" && o.country !== country) return false;
      if (type !== "all" && o.type !== type) return false;
      if (!q) return true;
      return (
        o.name.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q) ||
        o.location.toLowerCase().includes(q)
      );
    });
  }, [query, country, type]);

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="Opportunity Hub" role={profile.role} email={profile.email} onSignOut={signOut} />
      <div className="mx-auto max-w-6xl px-6 py-6">
        <BackButton />
      </div>
      <main className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">Universities & scholarships</h1>
          <p className="mt-2 text-muted-foreground">A curated directory of Pakistani and global opportunities.</p>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search universities, scholarships…"
              className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm"
            />
          </div>
          <select value={country} onChange={(e) => setCountry(e.target.value as typeof country)} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
            <option value="all">All countries</option>
            <option value="Pakistan">Pakistan</option>
            <option value="Global">Global</option>
          </select>
          <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
            <option value="all">All types</option>
            <option value="University">Universities</option>
            <option value="Scholarship">Scholarships</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">No results.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 stagger-children">
            {filtered.map((o) => (
              <a key={o.id} href={o.link} target="_blank" rel="noopener noreferrer" className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-[var(--color-ember)]/60">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${o.type === "Scholarship" ? "bg-[var(--color-ember)]/15 text-[var(--color-ember)]" : "bg-[var(--color-parchment)] text-foreground"}`}>{o.type}</span>
                  <span className="text-xs text-muted-foreground">{o.country}</span>
                </div>
                <h2 className="mt-2 font-display text-lg text-foreground">{o.name}</h2>
                <div className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {o.location}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{o.description}</p>
                <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-ember)] opacity-0 transition group-hover:opacity-100">
                  Visit <ExternalLink className="h-3 w-3" />
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
