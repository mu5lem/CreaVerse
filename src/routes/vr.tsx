import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
            <VRPlayers topic={active} split={split} />

            <p className="mt-4 text-center text-sm text-white/70">{active.description} · via {active.source}</p>
          </div>
        )}
      </main>
    </div>
  );
}

type YTPlayer = {
  getCurrentTime: () => number;
  getPlayerState: () => number;
  seekTo: (s: number, allow: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  destroy: () => void;
};
type YTNamespace = {
  Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer;
};

function useYouTubeApi() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w = window as unknown as { YT?: YTNamespace };
    if (w.YT?.Player) {
      setReady(true);
      return;
    }
    if (!document.getElementById("yt-iframe-api")) {
      const s = document.createElement("script");
      s.id = "yt-iframe-api";
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
    const iv = setInterval(() => {
      if ((window as unknown as { YT?: YTNamespace }).YT?.Player) {
        setReady(true);
        clearInterval(iv);
      }
    }, 150);
    return () => clearInterval(iv);
  }, []);
  return ready;
}

/**
 * Primary + optional split pane, both driven by the YouTube IFrame API so the
 * second pane always starts at — and stays locked to — the primary's timestamp.
 */
function VRPlayers({ topic, split }: { topic: VRTopic; split: boolean }) {
  const apiReady = useYouTubeApi();
  const primaryHost = useRef<HTMLDivElement | null>(null);
  const secondHost = useRef<HTMLDivElement | null>(null);
  const primaryRef = useRef<YTPlayer | null>(null);
  const secondRef = useRef<YTPlayer | null>(null);
  const timeRef = useRef(0);

  const baseVars = {
    rel: 0,
    modestbranding: 1,
    playsinline: 1,
    enablejsapi: 1,
  };

  // Primary player
  useEffect(() => {
    if (!apiReady || !primaryHost.current) return;
    const host = primaryHost.current;
    const el = document.createElement("div");
    host.appendChild(el);
    const YT = (window as unknown as { YT: YTNamespace }).YT;
    const player = new YT.Player(el, {
      videoId: topic.youtubeId,
      playerVars: baseVars,
      events: {
        onReady: () => {
          primaryRef.current = player;
        },
      },
    });
    const iv = setInterval(() => {
      try {
        const t = player.getCurrentTime?.();
        if (typeof t === "number" && Number.isFinite(t)) timeRef.current = t;
      } catch {
        /* player not ready yet */
      }
    }, 250);
    return () => {
      clearInterval(iv);
      try {
        player.destroy();
      } catch {
        /* already gone */
      }
      primaryRef.current = null;
      host.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiReady, topic.youtubeId]);

  // Split pane: created at the primary's exact position, then kept in lockstep
  useEffect(() => {
    if (!split || !apiReady || !secondHost.current) return;
    const host = secondHost.current;
    const el = document.createElement("div");
    host.appendChild(el);
    const startAt = Math.max(0, timeRef.current);
    const YT = (window as unknown as { YT: YTNamespace }).YT;
    const player = new YT.Player(el, {
      videoId: topic.youtubeId,
      playerVars: { ...baseVars, controls: 0, autoplay: 1, mute: 1, start: Math.floor(startAt) },
      events: {
        onReady: () => {
          secondRef.current = player;
          try {
            player.mute();
            player.seekTo(timeRef.current, true);
            player.playVideo();
          } catch {
            /* ignore */
          }
        },
      },
    });

    // Continuous drift correction + play/pause mirroring.
    const sync = setInterval(() => {
      const p = primaryRef.current;
      const s = secondRef.current;
      if (!p || !s) return;
      try {
        const pt = p.getCurrentTime();
        const st = s.getCurrentTime();
        if (Math.abs(pt - st) > 0.35) s.seekTo(pt, true);
        const state = p.getPlayerState(); // 1 = playing, 2 = paused
        if (state === 1 && s.getPlayerState() !== 1) s.playVideo();
        if (state === 2 && s.getPlayerState() === 1) s.pauseVideo();
      } catch {
        /* ignore */
      }
    }, 400);

    return () => {
      clearInterval(sync);
      try {
        player.destroy();
      } catch {
        /* already gone */
      }
      secondRef.current = null;
      host.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [split, apiReady, topic.youtubeId]);

  return (
    <div className={`flex-1 gap-4 ${split ? "grid grid-cols-2" : "grid grid-cols-1"}`}>
      <div className="relative overflow-hidden rounded-2xl bg-black [&_iframe]:h-full [&_iframe]:w-full [&>div]:h-full [&>div]:w-full">
        <div ref={primaryHost} className="h-full w-full" />
      </div>
      {split && (
        <div className="relative overflow-hidden rounded-2xl bg-black [&_iframe]:h-full [&_iframe]:w-full [&>div]:h-full [&>div]:w-full">
          <div ref={secondHost} className="h-full w-full" />
        </div>
      )}
    </div>
  );
}
