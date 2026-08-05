import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";
import { vrTopics, type VRTopic } from "@/lib/vr-topics";
import { Split, X, PlayCircle, ExternalLink, Wand2 } from "lucide-react";

export const Route = createFileRoute("/vr")({
  component: () => (
    <ProtectedRoute>
      <VRPage />
    </ProtectedRoute>
  ),
});

function VRPage() {
  const { profile, signOut } = useAuth();
  const [active, setActive] = useState<VRTopic | null>(null);
  const [split, setSplit] = useState(false);
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="Cardboard VR" role={profile.role} email={profile.email} onSignOut={signOut} />
      <div className="mx-auto max-w-6xl px-6 py-6">
        <BackButton />
      </div>
      <main className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-6 rounded-2xl border border-[var(--color-ember)]/40 bg-[var(--color-ember)]/10 p-4 text-sm text-foreground">
          ⚠️ <strong>Alpha Stage:</strong> This immersive feature is in early development. Enhanced cross-platform mobile cardboard optimizations coming soon.
        </div>
        <div className="mb-8">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">Immersive science lab</h1>
          <p className="mt-2 text-muted-foreground">Tap a topic to open its educational video — then use the split-view toggle for a Cardboard-ready stereo view.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {vrTopics.map((t) => (
            <button
              key={t.id}
              onClick={() => { setActive(t); setSplit(false); }}
              className="hover-lift press group overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition hover:border-[var(--color-ember)]/60"
            >
              <div className="relative aspect-video overflow-hidden bg-black">
                <img
                  src={`https://img.youtube.com/vi/${t.youtubeId}/hqdefault.jpg`}
                  alt={t.title}
                  loading="lazy"
                  className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <PlayCircle className="h-12 w-12 text-white drop-shadow-lg" />
                </div>
              </div>
              <div className="p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{t.category}</div>
                <h3 className="mt-1 font-display text-lg text-foreground">{t.title}</h3>
                <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">via {t.source}</div>
              </div>
            </button>
          ))}

          {/* Mathify — external partner tool */}
          <a
            href="https://mathify.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="hover-lift press group overflow-hidden rounded-2xl border-2 border-dashed border-[var(--color-ember)]/60 bg-gradient-to-br from-[var(--color-ember)]/10 to-transparent text-left shadow-sm transition"
          >
            <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-[var(--color-parchment)]">
              <Wand2 className="h-14 w-14 text-[var(--color-ember)] transition group-hover:scale-110" />
            </div>
            <div className="p-4">
              <div className="text-xs uppercase tracking-wider text-[var(--color-ember)]">Partner tool</div>
              <h3 className="mt-1 flex items-center gap-1.5 font-display text-lg text-foreground">
                Mathify <ExternalLink className="h-3.5 w-3.5" />
              </h3>
              <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Generate custom scientific and math visualizations on demand.
              </div>
            </div>
          </a>
        </div>

        {active && (
          <div className="fixed inset-0 z-50 flex flex-col bg-black/95 p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between text-white">
              <div>
                <div className="text-xs uppercase tracking-wider text-white/60">{active.category}</div>
                <h2 className="font-display text-2xl">{active.title}</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSplit((s) => !s)} className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20">
                  <Split className="h-4 w-4" /> {split ? "Single view" : "VR Split View"}
                </button>
                <button onClick={() => setActive(null)} className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20">
                  <X className="h-4 w-4" /> Close
                </button>
              </div>
            </div>
            <div className={`flex-1 gap-4 ${split ? "grid grid-cols-2" : "grid grid-cols-1"}`}>
              <VRScene topic={active} primary onTime={(t) => { timeRef.current = t; }} />
              {split && <VRScene topic={active} startAt={Math.max(0, Math.floor(timeRef.current))} muted />}
            </div>
            <p className="mt-4 text-center text-sm text-white/70">{active.description} · via {active.source}</p>
          </div>
        )}
      </main>
    </div>
  );
}

function VRScene({
  topic,
  primary = false,
  muted = false,
  startAt,
  onTime,
}: {
  topic: VRTopic;
  primary?: boolean;
  muted?: boolean;
  startAt?: number;
  onTime?: (seconds: number) => void;
}) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  // Track playback position of the primary player so a newly opened
  // split-view pane can start from the same moment.
  useEffect(() => {
    if (!primary) return;
    const win = frameRef.current?.contentWindow;
    const ping = () => {
      frameRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "listening", id: topic.id }),
        "*"
      );
    };
    const onMessage = (e: MessageEvent) => {
      if (typeof e.data !== "string") return;
      if (!e.origin.includes("youtube")) return;
      try {
        const parsed = JSON.parse(e.data) as { info?: { currentTime?: number } };
        const t = parsed?.info?.currentTime;
        if (typeof t === "number" && Number.isFinite(t)) onTime?.(t);
      } catch {
        /* ignore non-JSON messages */
      }
    };
    window.addEventListener("message", onMessage);
    const interval = setInterval(ping, 500);
    ping();
    void win;
    return () => {
      window.removeEventListener("message", onMessage);
      clearInterval(interval);
    };
  }, [primary, topic.id, onTime]);

  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    enablejsapi: "1",
  });
  if (startAt && startAt > 0) {
    params.set("start", String(startAt));
    params.set("autoplay", "1");
  }
  if (muted) params.set("mute", "1");
  const src = `https://www.youtube.com/embed/${topic.youtubeId}?${params.toString()}`;

  return (
    <div className="relative flex items-center justify-center overflow-hidden rounded-2xl bg-black">
      <iframe
        ref={frameRef}
        src={src}
        title={topic.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}
