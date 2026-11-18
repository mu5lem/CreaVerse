import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Journal = lazy(() => import("@/components/JournalPanel").then(m => ({ default: m.JournalPanel })));
const Game = lazy(() => import("@/components/MemoryGamePanel").then(m => ({ default: m.MemoryGamePanel })));

export const Route = createFileRoute("/mind-garden")({
  validateSearch: (s: Record<string, unknown>) => ({ tab: typeof s.tab === "string" ? s.tab : "journal" }),
  head: () => ({ meta: [
    { title: "Mind Garden — Journal & Memory Game | CreaVerse" },
    { name: "description", content: "Reflect on your learning in a private journal and unwind with the CreaVerse memory game." },
    { property: "og:title", content: "Mind Garden — CreaVerse" },
    { property: "og:description", content: "Private reflections and a memory game in one space." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <ProtectedRoute><MindGardenPage /></ProtectedRoute>,
});

function MindGardenPage() {
  const { profile, signOut } = useAuth();
  const { tab } = Route.useSearch();
  const game = tab === "minigame";
  if (!profile) return null;
  return <div className="min-h-screen bg-background">
    <DashboardHeader title="Mind Garden" role={profile.role} email={profile.email} onSignOut={signOut} />
    <div className="mx-auto max-w-3xl px-6 py-6"><BackButton /></div>
    <div className="mx-auto max-w-3xl px-6 pb-8">
      <h1 className="font-display text-4xl text-foreground">Mind Garden</h1>
      <p className="mt-3 text-sm text-muted-foreground">{profile.current_streak} {profile.current_streak === 1 ? "day" : "days"} streak</p>
      <nav aria-label="Mind Garden tabs" className="mt-5 flex flex-wrap gap-2">
        <Button asChild variant={!game ? "default" : "outline"}><Link to="/mind-garden" search={{ tab: "journal" }}>Journal</Link></Button>
        <Button asChild variant={game ? "default" : "outline"}><Link to="/mind-garden" search={{ tab: "minigame" }}>Memory Game</Link></Button>
      </nav>
    </div>
    <Suspense fallback={<p className="p-6 text-muted-foreground">Loading…</p>}>{game ? <Game /> : <Journal />}</Suspense>
  </div>;
}