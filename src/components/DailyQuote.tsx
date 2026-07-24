import { useEffect, useState } from "react";
import { Quote, X } from "lucide-react";

const QUOTES: { text: string; author: string }[] = [
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin" },
  { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Anyone who has never made a mistake has never tried anything new.", author: "Albert Einstein" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "The future belongs to those who learn more skills and combine them in creative ways.", author: "Robert Greene" },
  { text: "Knowledge is power. Information is liberating.", author: "Kofi Annan" },
];

export function DailyQuote({ userId }: { userId: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(window.localStorage.getItem(`quote_dismissed:${userId}:${today}`) === "1");
  }, [userId, today]);

  if (dismissed) return null;

  // Deterministic quote per day per user.
  const seed = [...`${userId}${today}`].reduce((a, c) => a + c.charCodeAt(0), 0);
  const q = QUOTES[seed % QUOTES.length];

  const dismiss = () => {
    try {
      window.localStorage.setItem(`quote_dismissed:${userId}:${today}`, "1");
    } catch { /* ignore */ }
    setDismissed(true);
  };

  return (
    <div className="animate-fade-up mb-6 flex items-start gap-3 rounded-2xl border border-border bg-gradient-to-br from-[var(--color-ember)]/10 to-transparent p-4 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-ember)]/15 text-[var(--color-ember)]">
        <Quote className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Quote of the day</div>
        <p className="mt-1 text-sm italic leading-relaxed text-foreground">"{q.text}"</p>
        <div className="mt-1 text-xs text-muted-foreground">— {q.author}</div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="press text-muted-foreground transition hover:text-foreground"
        aria-label="Dismiss for today"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}