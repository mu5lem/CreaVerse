import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BookLogo } from "@/components/BookLogo";
import { ContactHub } from "@/components/ContactHub";
import { useAuth } from "@/hooks/useAuth";
import { brand } from "@/lib/brand";
import {
  Sparkles,
  MessagesSquare,
  Boxes,
  Compass,
  Trophy,
  GraduationCap,
  NotebookPen,
  LineChart,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "CreaVerse — Learn, Visualize, and Build Things" },
      {
        name: "description",
        content:
          "CreaVerse is a Pakistan-first learning platform for students, teachers, and creators — quality education, AI mentorship, and VR lessons for every learner.",
      },

      { property: "og:title", content: "CreaVerse — Education for Everyone" },
      {
        property: "og:description",
        content:
          "Learn, visualize, and build things. A learning universe for Pakistani students and teachers, from Matric to university.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://spark-creaverse.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "CreaVerse — Education for Everyone" },
      {
        name: "twitter:description",
        content: "Learn, visualize, and build things — a learning universe for everyone.",
      },
    ],
    links: [{ rel: "canonical", href: "https://spark-creaverse.lovable.app/" }],
  }),
});


const roleHome = {
  student: "/student/dashboard",
  teacher: "/teacher/dashboard",
  admin: "/admin/dashboard",
} as const;

function Landing() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && profile && !profile.is_suspended) {
      navigate({ to: roleHome[profile.role] });
    }
  }, [loading, profile, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <BookLogo size={28} className="shrink-0 text-[var(--color-ink)] sm:h-8 sm:w-8" />
          <span className="truncate font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {brand.name}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            to="/about"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary sm:inline-flex"
          >
            About
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signin" }}
            className="rounded-full px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary sm:px-4"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 sm:px-5"
          >
            Get started
          </Link>
        </div>
      </nav>


      {/* hero */}
      <section className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-[var(--color-parchment)] px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ember)]" />
            {brand.shortPitch}
          </div>

          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-7xl md:text-8xl">
            Education
            <br />
            <span className="text-[var(--color-ember)]">for Everyone</span>
          </h1>

          <p className="mt-8 max-w-2xl text-xl font-semibold not-italic tracking-tight text-foreground sm:text-2xl">
            Learn, Visualize, and Build Things.
          </p>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {brand.name} is where students, teachers, and creators come together —
            from Matric to university, with AI mentorship and immersive lessons.
          </p>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="press inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              Create your account
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signin" }}
              className="press inline-flex items-center justify-center rounded-full border border-border bg-card px-7 py-3 text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              I already have one
            </Link>
          </div>
        </div>

        {/* Why CreaVerse — feature grid */}
        <div className="mt-24">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-[var(--color-parchment)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Why CreaVerse
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Everything you need to actually learn
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Sparkles, title: "AI Mentor", body: "24/7 tutor that answers, explains and remembers your progress." },
              { icon: MessagesSquare, title: "Classroom & Realtime Chat", body: "Join classes, message teachers and classmates instantly." },
              { icon: Boxes, title: "VR Learning", body: "Cardboard-ready science lessons — see atoms, gravity, circuits." },
              { icon: Compass, title: "Opportunity Hub", body: "Curated scholarships, competitions and internships." },
              { icon: Trophy, title: "Contests", body: "Live student contests with recognition and prizes." },
              { icon: GraduationCap, title: "Academy", body: "Free structured courses from Matric to university." },
              { icon: NotebookPen, title: "Daily Journal", body: "Reflect, track mood and build a real learning habit." },
              { icon: LineChart, title: "Analytics", body: "Predictive success score and at-risk detection." },
            ].map((f, i) => (
              <div
                key={f.title}
                style={{ animationDelay: `${i * 40}ms` }}
                className="hover-lift animate-fade-up rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-parchment)]">
                  <f.icon className="h-5 w-5 text-[var(--color-ember)]" />
                </div>
                <h3 className="font-display text-base text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <ContactHub />
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} {brand.name}</span>
            <span className="flex gap-4">
              <Link to="/faq" className="hover:text-foreground">FAQ</Link>
              <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground">Terms</Link>
            </span>
            <span className="italic">{brand.tagline}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
