import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";
import { academyData } from "@/lib/academy-data";
import { ChevronDown, BookOpen, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/academy")({
  head: () => ({
    meta: [
      { title: "Open-Source Academy — Free Learning Pathways | CreaVerse" },
      { name: "description", content: "Free learning pathways for Pakistani and global students — Matric, FSc, MDCAT, ECAT, CSS, Urdu, Islamiat, and more." },
      { property: "og:title", content: "Open-Source Academy — CreaVerse" },
      { property: "og:description", content: "Curated free courses and pathways for Pakistani learners, from board exams to competitive tests." },
      { property: "og:url", content: "/academy" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/academy" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Open-Source Academy",
        description: "Free learning pathways for students.",
        url: "https://spark-creaverse.lovable.app/academy",
      }),
    }],
  }),
  component: () => (
    <ProtectedRoute>
      <AcademyPage />
    </ProtectedRoute>
  ),
});

function AcademyPage() {
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState<string | null>(academyData[0]?.id ?? null);
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="Open-Source Academy" role={profile.role} email={profile.email} onSignOut={signOut} />
      <div className="mx-auto max-w-5xl px-6 py-6">
        <BackButton />
      </div>
      <main className="mx-auto max-w-5xl px-6 pb-16">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">Free learning pathways</h1>
          <p className="mt-2 text-muted-foreground">
            Real, curated links — Pakistani curriculum (Matric, FSc, MDCAT, ECAT) plus world-class free universities. Click any topic to open the resource.
          </p>
        </div>

        <div className="space-y-3">
          {academyData.map((cat) => {
            const isOpen = open === cat.id;
            return (
              <div key={cat.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <button
                  onClick={() => setOpen(isOpen ? null : cat.id)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-parchment)] text-[var(--color-ink)]">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-display text-lg text-foreground">{cat.title}</h2>
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    </div>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="grid gap-3 border-t border-border bg-[var(--color-parchment)]/40 p-6 sm:grid-cols-2 stagger-children">
                    {cat.modules.map((m, i) => (
                      <a
                        key={i}
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col rounded-xl border border-border bg-card p-4 transition hover:border-[var(--color-ember)] hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-foreground group-hover:text-[var(--color-ember)]">{m.title}</h4>
                          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-[var(--color-ember)]" />
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                        <span className="mt-3 inline-flex w-fit items-center rounded-full bg-[var(--color-parchment)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--color-ink)]">
                          {m.source}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-foreground">More Free Resources</h2>
          <p className="mt-1 text-sm text-muted-foreground">Hand-picked external sites — we link out, we don't reproduce their content.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 stagger-children">
            {[
              { name: "ParhloBhai", url: "https://parhlobhai.vercel.app/", desc: "Free O/A Levels, IGCSE, Matric and Intermediate notes and past papers (Pakistan-focused)." },
              { name: "Khan Academy", url: "https://www.khanacademy.org", desc: "World-class free lessons in math, science, coding, economics and more — for any level." },
              { name: "OpenStax", url: "https://openstax.org", desc: "Free, openly licensed college textbooks (Rice University) covering the sciences, math and humanities." },
              { name: "MIT OpenCourseWare", url: "https://ocw.mit.edu", desc: "Free lecture notes, exams and videos from actual MIT undergraduate and graduate courses." },
            ].map((r) => (
              <a
                key={r.name}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-[var(--color-ember)]/60"
              >
                <div>
                  <div className="font-display text-lg text-foreground">{r.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{r.desc}</div>
                </div>
                <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-[var(--color-ember)]" />
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

