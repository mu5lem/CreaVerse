import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/minigame")({
  component: () => (
    <ProtectedRoute>
      <Minigame />
    </ProtectedRoute>
  ),
});

const EMOJIS = ["🧠", "📚", "🔬", "🧮", "⚗️", "🔭", "🎓", "✏️"];

interface Card { id: number; emoji: string; flipped: boolean; matched: boolean }

function shuffle(): Card[] {
  const pairs = [...EMOJIS, ...EMOJIS];
  return pairs
    .map((e, i) => ({ id: i, emoji: e, flipped: false, matched: false }))
    .sort(() => Math.random() - 0.5)
    .map((c, i) => ({ ...c, id: i }));
}

function Minigame() {
  const { profile, signOut } = useAuth();
  const [cards, setCards] = useState<Card[]>(() => shuffle());
  const [picked, setPicked] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const allMatched = useMemo(() => cards.every((c) => c.matched), [cards]);

  useEffect(() => {
    if (picked.length !== 2) return;
    const [a, b] = picked;
    setMoves((m) => m + 1);
    const t = setTimeout(() => {
      setCards((prev) => {
        const match = prev[a].emoji === prev[b].emoji;
        return prev.map((c, i) => {
          if (i === a || i === b) {
            return match ? { ...c, matched: true, flipped: true } : { ...c, flipped: false };
          }
          return c;
        });
      });
      setPicked([]);
    }, 700);
    return () => clearTimeout(t);
  }, [picked]);

  const flip = (i: number) => {
    if (picked.length === 2) return;
    if (cards[i].flipped || cards[i].matched) return;
    setCards((prev) => prev.map((c, idx) => (idx === i ? { ...c, flipped: true } : c)));
    setPicked((p) => [...p, i]);
  };

  const reset = () => { setCards(shuffle()); setPicked([]); setMoves(0); };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="Memory Match" role={profile.role} email={profile.email} onSignOut={signOut} />
      <div className="mx-auto max-w-3xl px-6 py-6">
        <BackButton />
      </div>
      <main className="mx-auto max-w-3xl px-6 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">Memory Match</h1>
            <p className="mt-2 text-muted-foreground">Flip cards to find matching pairs. Try to finish in as few moves as possible.</p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Moves</div>
            <div className="font-display text-3xl text-foreground">{moves}</div>
          </div>
        </div>

        {allMatched && (
          <div className="mb-6 rounded-2xl border border-[var(--color-ember)]/40 bg-[var(--color-ember)]/10 p-4 text-center">
            <div className="font-display text-xl text-foreground">🎉 You won in {moves} moves!</div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-3">
          {cards.map((c, i) => (
            <button
              key={c.id}
              onClick={() => flip(i)}
              aria-label={c.flipped || c.matched ? `Card showing ${c.emoji}` : "Face-down memory card"}
              className={`aspect-square rounded-2xl border text-4xl transition ${
                c.flipped || c.matched
                  ? "border-[var(--color-ember)]/50 bg-card"
                  : "border-border bg-[var(--color-parchment)] hover:bg-[var(--color-parchment)]/70"
              } ${c.matched ? "opacity-60" : ""}`}
            >
              {(c.flipped || c.matched) ? c.emoji : ""}
            </button>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button onClick={reset} className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
            New game
          </button>
        </div>
      </main>
    </div>
  );
}
