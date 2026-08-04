import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";
import { ExternalLink, Users } from "lucide-react";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "STEM Community — CreaVerse" },
      { name: "description", content: "A curated list of real, verifiable global and Pakistani STEM communities for students to learn, contribute, and grow." },
      { property: "og:title", content: "STEM Community — CreaVerse" },
      { property: "og:description", content: "Real global and Pakistani STEM communities open to students." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <CommunityPage />
    </ProtectedRoute>
  ),
});

const COMMUNITIES = [
  { name: "PakSolve", url: "https://paksolveprogram-source.github.io/paksolve-site-new/", desc: "Pakistan STEM Problem Solving Talent Hunt for Matric/O-level students, mentored by MIT students and Olympiad medalists." },
  { name: "Khan Academy", url: "https://www.khanacademy.org", desc: "World-class free lessons in math, science, coding, economics, humanities." },
  { name: "Code.org", url: "https://code.org", desc: "Global movement to expand access to computer science and coding for K-12 students." },
  { name: "Zooniverse", url: "https://www.zooniverse.org", desc: "The largest citizen science platform — real research projects you can contribute to." },
  { name: "NASA STEM Engagement", url: "https://www.nasa.gov/learning-resources/for-students/", desc: "Free NASA STEM resources, internships, and challenges for students." },
  { name: "Kaggle", url: "https://www.kaggle.com", desc: "Global data science / ML community with free notebooks, datasets and competitions." },
  { name: "GitHub Education", url: "https://education.github.com", desc: "Free developer tools, learning tracks and the Student Developer Pack." },
  { name: "freeCodeCamp", url: "https://www.freecodecamp.org", desc: "Free, community-driven curriculum for web dev, data science and more, with real certifications." },
  { name: "OpenStax", url: "https://openstax.org", desc: "Free openly-licensed textbooks from Rice University." },
  { name: "MIT OpenCourseWare", url: "https://ocw.mit.edu", desc: "Free lecture notes, exams and videos from actual MIT courses." },
  { name: "Google Developers", url: "https://developers.google.com/community", desc: "Global Google Developer Student Clubs and community groups." },
];

function CommunityPage() {
  const { profile, signOut } = useAuth();
  if (!profile) return null;
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="STEM Community" role={profile.role} email={profile.email} onSignOut={signOut} />
      <div className="mx-auto max-w-5xl px-6 py-6"><BackButton /></div>
      <main className="mx-auto max-w-5xl px-6 pb-16">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-parchment)] px-3 py-1 text-xs font-medium">
            <Users className="h-3.5 w-3.5" /> Verified public communities
          </div>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground">Real communities. Real learning.</h1>
          <p className="mt-2 text-muted-foreground">
            We only link to established, publicly-accessible pages — no private invites.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 stagger-children">
          {COMMUNITIES.map((c) => (
            <a key={c.name} href={c.url} target="_blank" rel="noreferrer"
              className="group flex items-start justify-between gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-[var(--color-ember)]/60">
              <div>
                <div className="font-display text-lg text-foreground">{c.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">{c.desc}</div>
              </div>
              <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-[var(--color-ember)]" />
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
