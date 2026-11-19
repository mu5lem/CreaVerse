import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BookLogo } from "@/components/BookLogo";
import { useAuth } from "@/hooks/useAuth";
import { brand } from "@/lib/brand";
import {
  Sparkles,
  BookOpen,
  Users,
  Compass,
  Flower2,
  GraduationCap,
  Bot,
  Trophy,
  NotebookPen,
  Gamepad2,
  MessagesSquare,
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
          "CreaVerse is a Pakistan-first learning platform with three parts: School-in-a-Box (AI Mentor, Academy, Classroom), Outreach (opportunities, contests, community) and Mind Garden (journal and memory game).",
      },

      { property: "og:title", content: "CreaVerse — Education for Everyone" },
      {
        property: "og:description",
        content:
          "Learn, visualize, and build things. A learning universe for Pakistani students and teachers, from Matric to university.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${brand.siteUrl}/` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "CreaVerse — Education for Everyone" },
      {
        name: "twitter:description",
        content: "Learn, visualize, and build things — a learning universe for everyone.",
      },
    ],
    links: [{ rel: "canonical", href: `${brand.siteUrl}/` }],
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
            {brand.name} is where students, teachers, and creators come together — from Matric to
            university, with AI mentorship and live classrooms.
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

        {/* Three groups */}
        <div className="mt-24">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-[var(--color-parchment)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              What's inside
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Three places, one platform
            </h2>
          </div>

          {/* School-in-a-Box (featured) */}
          <section className="animate-fade-up rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-parchment)]">
                <GraduationCap className="h-6 w-6 text-[var(--color-ember)]" />
              </div>
              <div>
                <h3 className="font-display text-2xl text-foreground sm:text-3xl">
                  School-in-a-Box
                </h3>
                <p className="text-sm text-muted-foreground">
                  Everything a student needs to learn, in one place.
                </p>
              </div>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Bot,
                  title: "AI Mentor",
                  body: "A study helper in English or Urdu for any subject, from Matric to university.",
                },
                {
                  icon: BookOpen,
                  title: "Academy",
                  body: "Free pathways for Matric, FSc, MDCAT, ECAT, CSS and university, with progress tracking.",
                },
                {
                  icon: Users,
                  title: "Classroom",
                  body: "Join classes, chat live, submit assignments, take self-grading quizzes and see your analytics.",
                },
              ].map((f) => (
                <div key={f.title} className="rounded-2xl border border-border bg-background p-5">
                  <f.icon className="h-5 w-5 text-[var(--color-ember)]" />
                  <h4 className="mt-3 font-display text-lg text-foreground">{f.title}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <section className="hover-lift animate-fade-up rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Compass className="h-6 w-6 text-[var(--color-ember)]" />
                <h3 className="font-display text-xl text-foreground">Outreach</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                One directory to look beyond the classroom.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-foreground">
                <li className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-muted-foreground" /> Opportunities: scholarships,
                  universities and programs
                </li>
                <li className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" /> Contests and competitions
                </li>
                <li className="flex items-center gap-2">
                  <MessagesSquare className="h-4 w-4 text-muted-foreground" /> Learning communities
                </li>
              </ul>
            </section>
            <section className="hover-lift animate-fade-up rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Flower2 className="h-6 w-6 text-[var(--color-ember)]" />
                <h3 className="font-display text-xl text-foreground">Mind Garden</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Slow down, reflect and keep your mind sharp.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-foreground">
                <li className="flex items-center gap-2">
                  <NotebookPen className="h-4 w-4 text-muted-foreground" /> Daily journal with mood
                  tracking and a real streak
                </li>
                <li className="flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4 text-muted-foreground" /> Memory game for a quick
                  brain break
                </li>
                <li className="flex items-center gap-2">
                  <LineChart className="h-4 w-4 text-muted-foreground" /> Build a steady learning
                  habit
                </li>
              </ul>
            </section>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs text-muted-foreground">
          <span>
            © {new Date().getFullYear()} {brand.name}
          </span>
          <span>{brand.tagline}</span>
        </div>
      </footer>
    </div>
  );
}
