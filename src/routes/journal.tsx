import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { NotebookPen, Pencil, Trash2 } from "lucide-react";
import { GlassWater, Plus, Minus } from "lucide-react";
import { useConfirm } from "@/components/ConfirmDialog";
import { useDraft } from "@/hooks/useDraft";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Daily Journal — CreaVerse" },
      { name: "description", content: "Your private daily learning journal — track mood, reflections, and growth over time." },
      { property: "og:title", content: "Daily Journal — CreaVerse" },
      { property: "og:description", content: "Private, real-time-synced diary for learners." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <JournalPage />
    </ProtectedRoute>
  ),
});

interface SelfAssessment {
  focus: number;
  understanding: number;
  confidence: number;
}
interface Entry {
  id: string;
  entry_date: string;
  mood: string | null;
  content: string;
  created_at: string;
  self_assessment: SelfAssessment | null;
}

const MOODS = ["😀 Great", "🙂 Good", "😐 Okay", "😕 Low", "😢 Struggling"];
const ASSESSMENTS: { key: keyof SelfAssessment; label: string; hint: string }[] = [
  { key: "focus", label: "Focus", hint: "How well could you concentrate?" },
  { key: "understanding", label: "Understanding", hint: "Did today's material make sense?" },
  { key: "confidence", label: "Confidence", hint: "How confident do you feel about it?" },
];

function JournalPage() {
  const { profile, signOut, user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [mood, setMood] = useState<string>(MOODS[1]);
  const [content, setContent, clearContent] = useDraft(user ? `draft:journal:${user.id}` : "draft:journal:anon");
  const [assessment, setAssessment] = useState<SelfAssessment>({ focus: 3, understanding: 3, confidence: 3 });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // Water intake counter — per user + per day, persisted in localStorage.
  const todayKey = new Date().toISOString().slice(0, 10);
  const waterKey = user ? `water:${user.id}:${todayKey}` : "water:anon";
  const [water, setWater] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setWater(Number(window.localStorage.getItem(waterKey) ?? 0));
    } catch {
      setWater(0);
    }
  }, [waterKey]);
  const setAndPersistWater = (n: number) => {
    const next = Math.max(0, Math.min(20, n));
    setWater(next);
    try {
      window.localStorage.setItem(waterKey, String(next));
    } catch {
      /* ignore */
    }
  };
  const WATER_GOAL = 8;

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setEntries((data ?? []) as Entry[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
    if (!user) return;
    const channel = supabase
      .channel(`journal-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "journal_entries", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim() || saving) return;
    setSaving(true);
    const { error } = await supabase.from("journal_entries").insert({
      user_id: user.id,
      mood,
      content: content.trim(),
      self_assessment: assessment,
    } as never);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Entry saved");
    clearContent();
  };

  const confirm = useConfirm();

  const beginEdit = (e: Entry) => {
    setEditingId(e.id);
    setEditContent(e.content);
  };

  const saveEdit = async (id: string) => {
    if (!user) return;
    const trimmed = editContent.trim();
    if (!trimmed) return;
    const { error } = await supabase
      .from("journal_entries")
      .update({ content: trimmed })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    setEditingId(null);
    await load();
  };

  const deleteEntry = async (id: string) => {
    if (!user) return;
    const ok = await confirm({ title: "Delete this journal entry?", confirmText: "Delete", destructive: true });
    if (!ok) return;
    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    await load();
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="Daily Journal" role={profile.role} email={profile.email} onSignOut={signOut} />
      <div className="mx-auto max-w-3xl px-6 py-6"><BackButton /></div>
      <main className="mx-auto max-w-3xl px-6 pb-16">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-parchment)] px-3 py-1 text-xs font-medium">
            <NotebookPen className="h-3.5 w-3.5" /> Private to you
          </div>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground">How was today?</h1>
          <p className="mt-2 text-muted-foreground">Reflect daily. Only you can read these entries.</p>
        </div>

        {/* Water intake tracker */}
        <div className="animate-fade-up mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-parchment)] text-[var(--color-ember)]">
                <GlassWater className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-lg text-foreground">Water today</div>
                <div className="text-[11px] text-muted-foreground">Goal: {WATER_GOAL} glasses · {water}/{WATER_GOAL}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAndPersistWater(water - 1)}
                disabled={water === 0}
                className="press flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:bg-secondary disabled:opacity-40"
                aria-label="Remove one glass"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setAndPersistWater(water + 1)}
                className="press flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-ember)] text-white transition hover:opacity-90"
                aria-label="Add one glass"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: WATER_GOAL }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setAndPersistWater(i + 1 === water ? i : i + 1)}
                className={`press h-9 w-6 rounded-b-lg rounded-t-sm border-2 transition ${
                  i < water
                    ? "border-[var(--color-ember)] bg-[var(--color-ember)]/70"
                    : "border-border bg-background"
                }`}
                aria-label={`Glass ${i + 1}`}
              />
            ))}
          </div>
          {water >= WATER_GOAL && (
            <div className="animate-pop-in mt-3 text-xs font-medium text-[var(--color-ember)]">
              ✓ Hydration goal reached — great job!
            </div>
          )}
        </div>

        <form onSubmit={save} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-3 flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button key={m} type="button" onClick={() => setMood(m)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${mood === m ? "border-[var(--color-ember)] bg-[var(--color-ember)]/10 text-foreground" : "border-border text-muted-foreground hover:border-foreground/30"}`}>
                {m}
              </button>
            ))}
          </div>
          <div className="mb-4 grid gap-3 rounded-xl border border-border bg-background/60 p-4 sm:grid-cols-3">
            {ASSESSMENTS.map((a) => (
              <label key={a.key} className="flex flex-col gap-1 text-xs">
                <span className="flex items-center justify-between text-foreground">
                  <span className="font-medium">{a.label}</span>
                  <span className="rounded bg-[var(--color-parchment)] px-1.5 font-mono text-[10px]">{assessment[a.key]}/5</span>
                </span>
                <input
                  type="range" min={1} max={5} step={1}
                  value={assessment[a.key]}
                  onChange={(ev) => setAssessment({ ...assessment, [a.key]: Number(ev.target.value) })}
                  className="w-full accent-[var(--color-ember)]"
                />
                <span className="text-[10px] text-muted-foreground">{a.hint}</span>
              </label>
            ))}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What did you learn, feel, or struggle with today?"
            rows={5}
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          <button type="submit" disabled={saving || !content.trim()}
            className="mt-3 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
            {saving ? "Saving…" : "Save entry"}
          </button>
        </form>

        <h2 className="mt-10 mb-3 font-display text-2xl text-foreground">Past entries</h2>
        {loading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
            No entries yet. Your first reflection is the hardest — and the most valuable.
          </div>
        ) : (
          <ul className="space-y-3">
            {entries.map((e) => (
              <li key={e.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(e.created_at).toLocaleString()}</span>
                  {e.mood && <span>{e.mood}</span>}
                </div>
                {e.self_assessment && (
                  <div className="mb-2 flex flex-wrap gap-2 text-[10px]">
                    {ASSESSMENTS.map((a) => (
                      <span key={a.key} className="rounded-full bg-[var(--color-parchment)] px-2 py-0.5 font-medium text-foreground">
                        {a.label}: {e.self_assessment![a.key]}/5
                      </span>
                    ))}
                  </div>
                )}
                {editingId === e.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(ev) => setEditContent(ev.target.value)}
                      rows={4}
                      className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(e.id)}
                        className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap text-sm text-foreground">{e.content}</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => beginEdit(e)}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground transition hover:bg-secondary"
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      <button
                        onClick={() => deleteEntry(e.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium text-destructive transition hover:border-destructive/50"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
