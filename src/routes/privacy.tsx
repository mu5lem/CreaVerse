import { createFileRoute, Link } from "@tanstack/react-router";
import { BookLogo } from "@/components/BookLogo";
import { brand } from "@/lib/brand";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — CreaVerse" },
      { name: "description", content: "How CreaVerse collects, uses, and protects your data as an education platform for students, teachers, and admins." },
      { property: "og:title", content: "CreaVerse Privacy Policy" },
      { property: "og:description", content: "Our approach to student privacy, data handling, retention, and user rights." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/privacy" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-8">
        <Link to="/" className="flex items-center gap-3">
          <BookLogo size={32} className="text-[var(--color-ink)]" />
          <span className="font-display text-xl font-semibold text-foreground">{brand.name}</span>
        </Link>
        <Link to="/" className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary">
          Back home
        </Link>
      </div>
      <main className="prose mx-auto max-w-3xl px-6 pb-16 text-foreground">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: July 22, 2026</p>

        <h2 className="mt-8 font-display text-2xl">1. Who we are</h2>
        <p>{brand.name} is an education platform built for Pakistani and global learners. This policy explains what data we collect, why, and how you can control it.</p>

        <h2 className="mt-6 font-display text-2xl">2. Data we collect</h2>
        <ul className="list-disc pl-6">
          <li><strong>Account data:</strong> email or phone, full name, gender, and (optionally) your school/college.</li>
          <li><strong>Learning data:</strong> classes you join, assignments and submissions, mentor chat history, journal entries.</li>
          <li><strong>Usage data:</strong> feature interactions and basic device/browser info used to keep the service reliable.</li>
        </ul>

        <h2 className="mt-6 font-display text-2xl">3. How we use it</h2>
        <ul className="list-disc pl-6">
          <li>To operate the platform (classes, submissions, chat, AI mentor, journal).</li>
          <li>To personalize your experience (subject choice, level).</li>
          <li>To improve product quality via aggregated onboarding survey responses.</li>
        </ul>
        <p>We do <strong>not</strong> sell your personal data.</p>

        <h2 className="mt-6 font-display text-2xl">4. Who can see your data</h2>
        <ul className="list-disc pl-6">
          <li>Your journal entries and mentor chats are strictly private to you (enforced by database-level policies).</li>
          <li>Your class chat and submissions are visible to that class's teacher and enrolled classmates as appropriate.</li>
          <li>Admins can see aggregated onboarding stats and manage accounts, but not your private journal or mentor history.</li>
        </ul>

        <h2 className="mt-6 font-display text-2xl">5. Retention</h2>
        <p>We keep your data while your account is active. Deleting your account removes your profile, journal, mentor history, submissions, and enrollments.</p>

        <h2 className="mt-6 font-display text-2xl">6. Your rights</h2>
        <p>You can request access to, correction of, or deletion of your data at any time by contacting us. Where applicable, you may also object to certain processing.</p>

        <h2 className="mt-6 font-display text-2xl">7. Children</h2>
        <p>{brand.name} is designed for learners including school-aged children. Parents/guardians of children under 13 should supervise account creation and can contact us to request deletion.</p>

        <h2 className="mt-6 font-display text-2xl">8. Security</h2>
        <p>Data is stored on managed cloud infrastructure with row-level security. No system is perfectly secure — please use a strong password and keep your credentials private.</p>

        <h2 className="mt-6 font-display text-2xl">9. Contact</h2>
        <p>Data requests and privacy questions: <a href="mailto:support@creaverse.site" className="underline">support@creaverse.site</a>.</p>
      </main>
    </div>
  );
}
