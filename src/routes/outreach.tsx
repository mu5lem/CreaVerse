import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ExternalLink } from "lucide-react";

const directoryQuery = queryOptions({
  queryKey: ["outreach-directory"],
  queryFn: async () => {
    const [o, c, community] = await Promise.all([
      import("@/lib/opportunities-data"),
      import("@/lib/contests-data"),
      import("@/lib/community-data"),
    ]);
    return {
      opportunities: o.opportunities.map((x) => ({
        id: x.id,
        name: x.name,
        description: x.description,
        link: x.link,
        type: x.type,
        country: x.country,
        detail: x.location,
        platform: "",
        deadline: null as string | null,
      })),
      contests: c.contests.map((x) => ({
        id: x.id,
        name: x.name,
        description: x.description,
        link: x.link,
        type: x.category,
        country: x.scope,
        detail: "",
        platform: "",
        deadline: null as string | null,
      })),
      community: community.communities.map((x) => ({
        id: x.url,
        name: x.name,
        description: x.desc,
        link: x.url,
        type: "Community",
        country: "",
        detail: "",
        platform: new URL(x.url).hostname,
        deadline: null as string | null,
      })),
    };
  },
  staleTime: Infinity,
});

export const Route = createFileRoute("/outreach")({
  validateSearch: (s: Record<string, unknown>) => ({
    tab:
      (["opportunities", "contests", "community"] as const).find((t) => t === s.tab) ??
      "opportunities",
    q: typeof s.q === "string" ? s.q.slice(0, 100) : "",
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(directoryQuery),
  head: () => ({
    meta: [
      { title: "Outreach — Opportunities, Contests & Community | CreaVerse" },
      {
        name: "description",
        content:
          "Explore Pakistani and global scholarships, universities, contests and learning communities in CreaVerse Outreach.",
      },
      { property: "og:title", content: "Outreach — CreaVerse" },
      {
        property: "og:description",
        content: "Opportunities, contests and community in one directory.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: () => (
    <p role="alert" className="p-6">
      Outreach could not load. Please try again.
    </p>
  ),
  notFoundComponent: () => <p className="p-6">Directory not found.</p>,
  component: () => (
    <ProtectedRoute>
      <OutreachPage />
    </ProtectedRoute>
  ),
});

const tabs = ["opportunities", "contests", "community"] as const;

function OutreachCard({
  entry,
}: {
  entry: {
    name: string;
    description: string;
    link: string;
    type: string;
    country: string;
    detail: string;
  };
}) {
  return (
    <a
      href={entry.link}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-ember"
    >
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded bg-accent/15 px-2 py-1 text-foreground">{entry.type}</span>
        <span className="py-1 text-muted-foreground">{entry.country}</span>
      </div>
      <h2 className="mt-3 break-words font-display text-lg text-foreground">{entry.name}</h2>
      {entry.detail && <p className="mt-1 text-xs text-muted-foreground">{entry.detail}</p>}
      <p className="mt-2 text-sm text-muted-foreground">{entry.description}</p>
      <ExternalLink className="mt-4 h-4 w-4 text-ember" />
    </a>
  );
}

function OutreachPage() {
  const { profile, signOut } = useAuth();
  const { data } = useSuspenseQuery(directoryQuery);
  const { tab, q } = Route.useSearch();
  const active = tab;
  const navigate = useNavigate({ from: "/outreach" });
  const [draft, setDraft] = useState(q);
  const [country, setCountry] = useState("all");
  const [type, setType] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [limit, setLimit] = useState(24);
  const [sort, setSort] = useState("default");
  useEffect(() => {
    setDraft(q);
  }, [q]);
  useEffect(() => {
    if (draft === q) return;
    const timer = setTimeout(() => {
      navigate({ search: (prev) => ({ ...prev, q: draft }), replace: true });
    }, 250);
    return () => clearTimeout(timer);
  }, [draft, q, navigate]);
  useEffect(() => {
    setLimit(24);
  }, [active, q, country, type, platform, sort]);
  useEffect(() => {
    setCountry("all");
    setType("all");
    setPlatform("all");
  }, [active]);
  const searched = useMemo(() => {
    const matches = (x: { name: string; description: string; detail: string }) =>
      `${x.name} ${x.description} ${x.detail}`.toLowerCase().includes(q.trim().toLowerCase());
    return {
      opportunities: data.opportunities.filter(matches),
      contests: data.contests.filter(matches),
      community: data.community.filter(matches),
    };
  }, [data, q]);
  const filtered = useMemo(
    () =>
      searched[active]
        .filter(
          (x) =>
            (country === "all" || x.country === country) &&
            (type === "all" || x.type === type) &&
            (platform === "all" || x.platform === platform),
        )
        .sort((a, b) =>
          sort === "closing"
            ? (a.deadline ? Date.parse(a.deadline) : Infinity) -
              (b.deadline ? Date.parse(b.deadline) : Infinity)
            : 0,
        ),
    [searched, active, country, type, platform, sort],
  );
  if (!profile) return null;
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        title="Outreach"
        role={profile.role}
        email={profile.email}
        onSignOut={signOut}
      />
      <div className="mx-auto max-w-6xl px-6 py-6">
        <BackButton />
      </div>
      <main className="mx-auto max-w-6xl px-6 pb-16">
        <h1 className="font-display text-4xl text-foreground">Outreach</h1>
        <input
          aria-label="Search Outreach"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Search opportunities, contests and communities"
          className="mt-6 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm"
        />
        <nav aria-label="Outreach tabs" className="my-5 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <Button asChild variant={active === t ? "default" : "outline"} key={t}>
              <Link to="/outreach" search={{ tab: t, q }}>
                {t[0].toUpperCase() + t.slice(1)} {searched[t].length}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="mb-6 flex flex-wrap gap-3">
          {active !== "community" && (
            <select
              aria-label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="rounded-md border border-input bg-background p-2 text-sm"
            >
              <option value="all">All countries</option>
              <option>Pakistan</option>
              <option>Global</option>
            </select>
          )}
          {active !== "community" && (
            <select
              aria-label="Type or category"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-md border border-input bg-background p-2 text-sm"
            >
              <option value="all">All {active === "contests" ? "categories" : "types"}</option>
              {[...new Set(data[active].map((x) => x.type))].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          )}
          {active === "community" && (
            <select
              aria-label="Platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="max-w-full rounded-md border border-input bg-background p-2 text-sm"
            >
              <option value="all">All platforms</option>
              {[...new Set(data.community.map((x) => x.platform))].sort().map((pl) => (
                <option key={pl}>{pl}</option>
              ))}
            </select>
          )}
          {data[active].some((x) => x.deadline) && (
            <select
              aria-label="Sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-md border border-input bg-background p-2 text-sm"
            >
              <option value="default">Default</option>
              <option value="closing">Closing soon</option>
            </select>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.slice(0, limit).map((x) => (
            <OutreachCard key={x.id} entry={x} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="py-8 text-muted-foreground">No results match your filters.</p>
        )}
        {limit < filtered.length && (
          <Button className="mt-6" variant="outline" onClick={() => setLimit((n) => n + 24)}>
            Load more
          </Button>
        )}
      </main>
    </div>
  );
}
